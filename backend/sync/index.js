// index.js — WebSocket sync server for LiveSession

import 'dotenv/config';
import { WebSocketServer } from 'ws';
import { createRequire } from 'module';
import SessionManager from './SessionManager.js';
import { registerMetrics } from './metrics.js';
import { createHttpServer } from './health.js';
import {
  validateMessage,
  MESSAGE_TYPE,
  ROLE,
  ERROR_CODE,
  buildError,
  ThrottleTimer,
} from './protocol.js';

const require = createRequire(import.meta.url);
const pino = require('pino');

const config = {
  host: process.env.WS_HOST || '0.0.0.0',
  port: parseInt(process.env.WS_PORT || '8080', 10),
  httpPort: parseInt(process.env.HTTP_PORT || '8081', 10),
  sessionTtlMs: parseInt(process.env.SESSION_TTL_MS || '7200000', 10),
  playheadThrottleMs: parseInt(process.env.PLAYHEAD_THROTTLE_MS || '33', 10),
  pingIntervalMs: parseInt(process.env.PING_INTERVAL_MS || '30000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  metricsEnabled: process.env.METRICS_ENABLED !== 'false',
  healthEnabled: process.env.HEALTH_ENABLED !== 'false',
};

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

const logger = pino({
  level: config.logLevel,
  transport: config.logLevel === 'debug' ? {
    target: 'pino-pretty',
    options: { colorize: true },
  } : undefined,
});

// ---------------------------------------------------------------------------
// Session Manager
// ---------------------------------------------------------------------------

const sessionManager = new SessionManager(config.sessionTtlMs);

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

let metrics = null;
if (config.metricsEnabled) {
  metrics = registerMetrics(sessionManager);
  globalThis.__PROM_CLIENT__ = metrics;
}

// ---------------------------------------------------------------------------
// HTTP server (health + metrics)
// ---------------------------------------------------------------------------

if (config.healthEnabled) {
  const notifyUpdate = ({ version, url, message }) => {
    const msg = {
      type: MESSAGE_TYPE.UPDATE_AVAILABLE,
      payload: { version, url, message },
    };
    const count = sessionManager.notifyAllHosts(JSON.stringify(msg));
    logger.info({ version, count }, 'Update notification sent to hosts');
    return count;
  };

  const httpResult = createHttpServer({
    port: config.httpPort,
    sessionManager,
    metrics,
    notifyUpdate,
  });

  httpResult.listen(config.httpPort).then(() => {
    logger.info(`HTTP server listening on port ${config.httpPort} (health + metrics)`);
  }).catch((err) => {
    logger.error({ err }, 'Failed to start HTTP server');
    process.exit(1);
  });
}

// ---------------------------------------------------------------------------
// WebSocket server
// ---------------------------------------------------------------------------

const wss = new WebSocketServer({
  host: config.host,
  port: config.port,
});

wss.on('error', (err) => {
  logger.error({ err }, 'WebSocket server error');
});

// Map to store per-session throttle timers
const sessionThrottles = new Map();

/**
 * Get (or lazily create) the throttle timer for a session.
 * Used by the module-scoped handleHostMessage for playback throttling.
 * @param {string} sessionId
 */
function getSessionThrottle(sessionId) {
  if (!sessionThrottles.has(sessionId)) {
    sessionThrottles.set(sessionId, new ThrottleTimer(config.playheadThrottleMs));
  }
  return sessionThrottles.get(sessionId);
}

wss.on('listening', () => {
  logger.info(`WebSocket sync server listening on ${config.host}:${config.port}`);
});

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  logger.info({ clientIp }, 'Client connected');

  ws.isAlive = true;

  // Per-connection inactivity timeout (closes stale connections)
  ws._pingTimer = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify(buildError(ERROR_CODE.INVALID_MESSAGE, 'Invalid JSON')));
      return;
    }

    const v = validateMessage(msg);
    if (!v.ok) {
      ws.send(JSON.stringify(buildError(ERROR_CODE.INVALID_MESSAGE, v.error)));
      metrics?.onMessage('invalid', msg.type || 'unknown');
      return;
    }

    // Handle ping/pong
    if (msg.type === MESSAGE_TYPE.PING) {
      ws.send(JSON.stringify({ type: MESSAGE_TYPE.PONG }));
      return;
    }
    if (msg.type === MESSAGE_TYPE.PONG) {
      ws.isAlive = true;
      return;
    }

    if (msg.type === MESSAGE_TYPE.REGISTER) {
      handleRegister(ws, msg);
      return;
    }

    // All other messages require registration
    if (!ws.sessionId) {
      ws.send(JSON.stringify(buildError(ERROR_CODE.NOT_INITIALIZED, 'Not registered')));
      return;
    }

    if (ws.role === ROLE.HOST) {
      handleHostMessage(ws, msg);
    } else if (ws.role === ROLE.CLIENT) {
      handleClientMessage(ws, msg);
    }
  });

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('close', (code, reason) => {
    logger.info({ clientIp, code, reason: reason.toString() }, 'Client disconnected');
    sessionManager.removeConnection(ws);
  });

  ws.on('error', (err) => {
    logger.warn({ err, clientIp }, 'WebSocket connection error');
    sessionManager.removeConnection(ws);
  });
});

// ---------------------------------------------------------------------------
// Message handlers
// ---------------------------------------------------------------------------

/**
 * Handle registration: create/join a session.
 * Host creates or reclaims a session. Client joins an existing session.
 */
function handleRegister(ws, msg) {
  const { role, sessionId } = msg;

  if (role === ROLE.HOST) {
    const result = sessionManager.registerHost(ws, sessionId || null);
    if (!result.ok) {
      if (result.error === 'SESSION_TAKEN') {
        ws.send(JSON.stringify(buildError(ERROR_CODE.SESSION_TAKEN, 'Session ID is already in use by another host')));
        ws.close(4001, 'Session taken');
        return;
      }
    } else {
      const session = result.session;
      const assignedId = session.sessionId;
      ws.sessionId = assignedId;
      ws.role = ROLE.HOST;

      if (!sessionId) {
        // New session created — send the assigned ID back to host
        ws.send(JSON.stringify({ type: 'session_created', payload: { sessionId: assignedId } }));
        metrics?.registerSession();
        logger.info(`Host registered: session=${assignedId}`);
      } else {
        ws.send(JSON.stringify({ type: 'session_reclaimed', payload: { sessionId: assignedId } }));
        metrics?.registerSession();
        logger.info(`Host reconnected: session=${assignedId}`);
      }
    }
  } else if (role === ROLE.CLIENT) {
    if (!sessionId) {
      ws.send(JSON.stringify(buildError(ERROR_CODE.SESSION_NOT_FOUND, 'sessionId is required for clients')));
      ws.close(4002, 'Session ID required');
      return;
    }

    const result = sessionManager.registerClient(ws, sessionId);
    if (!result.ok) {
      ws.send(JSON.stringify(buildError(result.error, `Cannot join session: ${result.error}`)));
      ws.close(4003, result.error);
      return;
    }

    ws.sessionId = sessionId;
    ws.role = ROLE.CLIENT;

    // Send welcome with current snapshot (if host already published state)
    const welcomePayload = { sessionId, snapshot: result.snapshot };
    ws.send(JSON.stringify({ type: MESSAGE_TYPE.WELCOME, payload: welcomePayload }));

    // Notify host about new client
    if (result.session.host) {
      result.session.host.send(JSON.stringify({
        type: 'client_joined',
        payload: { clientCount: result.session.clientCount }
      }));
    }

    metrics?.registerSession();
    logger.info(`Client joined: session=${sessionId}, total_clients=${result.session.clientCount}`);
  } else {
    ws.send(JSON.stringify(buildError(ERROR_CODE.INVALID_MESSAGE, 'role must be "host" or "client"')));
    ws.close(4000, 'Invalid role');
  }
}

/**
 * Handle messages from the host (desktop app):
 * - State broadcasts (track/mixer/playback/segments/groups/nav) → forward to clients
 * - Session commands (goodbye)
 */
function handleHostMessage(ws, msg) {
  const { sessionId } = ws;

  // Only forward "state" messages to clients. Control messages are internal.
  const stateTypes = [
    MESSAGE_TYPE.TRACK,
    MESSAGE_TYPE.MIXER,
    MESSAGE_TYPE.PLAYBACK,
    MESSAGE_TYPE.SEGMENTS,
    MESSAGE_TYPE.GROUPS,
    MESSAGE_TYPE.NAV,
  ];

  if (msg.type === MESSAGE_TYPE.GOODBYE) {
    // Host is shutting down — notify clients
    const session = sessionManager.getSession(sessionId);
    if (session) {
      for (const client of session.clients) {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: MESSAGE_TYPE.ERROR,
            payload: { code: ERROR_CODE.HOST_DISCONNECTED, message: 'Host is shutting down' }
          }));
        }
      }
    }
    ws.close(1000, 'Goodbye');
    return;
  }

  if (stateTypes.includes(msg.type)) {
    metrics?.onMessage('host->client', msg.type);

    // Throttle playback messages per-session; pass everything else through.
    if (msg.type === MESSAGE_TYPE.PLAYBACK) {
      const throttle = getSessionThrottle(sessionId);
      throttle.call(() => {
        metrics?.onPlayhead();
        sessionManager.broadcastFromHost(sessionId, msg);
      });
    } else {
      sessionManager.broadcastFromHost(sessionId, msg);
    }
  }
}

/**
 * Handle messages from a client (mobile/browser):
 * - Commands (cmd) → forward to host
 */
function handleClientMessage(ws, msg) {
  const { sessionId } = ws;

  if (msg.type === MESSAGE_TYPE.CMD) {
    metrics?.onMessage('client->host', msg.type);

    // Forward command to host
    const forwarded = sessionManager.forwardToClient(sessionId, {
      type: 'cmd_from_client',
      payload: msg.payload,
      clientId: ws._clientId || ws.upgradeHead?.toString('base64').slice(0, 8),
    });

    if (forwarded) {
      // Echo back ack (optional — can be used for QoS)
      // ws.send(JSON.stringify({ type: 'cmd_ack' }));
    } else {
      ws.send(JSON.stringify(buildError(ERROR_CODE.HOST_DISCONNECTED, 'Host is not available')));
    }
  }
}

// ---------------------------------------------------------------------------
// Keepalive: periodic ping/pong
// ---------------------------------------------------------------------------

const keepalive = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      logger.warn('Terminating dead connection');
      return ws.terminate();
    }
    if (ws.readyState === ws.OPEN) {
      ws.isAlive = false;
      // Send a protocol-level ping (control frame). Every conformant client
      // (browser WebSocket, ws library, our C++ RFC6455 client) replies with a
      // pong automatically, so keepalive no longer depends on JS handlers.
      ws.ping();
    }
  }
}, config.pingIntervalMs);

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down...`);

  clearInterval(keepalive);

  for (const ws of wss.clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: MESSAGE_TYPE.GOODBYE }));
      ws.close(1001, 'Server shutting down');
    }
  }

  wss.close(() => {
    logger.info('WebSocket server closed');
    sessionManager.close();
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Force shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Export for testing
export {
  config,
  sessionManager,
  wss,
  logger,
  metrics,
};
