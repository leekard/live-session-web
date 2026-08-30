// metrics.js — Prometheus metrics for the LiveSession sync server.

import client from 'prom-client';

// Collect default metrics (event loop, memory, etc.)
client.collectDefaultMetrics({ timeout: 5000 });

// Custom metrics
const sessionsTotal = new client.Counter({
  name: 'livesession_sessions_total',
  help: 'Total number of sessions created',
});

const sessionsActive = new client.Gauge({
  name: 'livesession_sessions_active',
  help: 'Number of active sessions with a connected host',
});

const connectionsActive = new client.Gauge({
  name: 'livesession_connections_active',
  help: 'Total active WebSocket connections (host + clients)',
});

const messagesTotal = new client.Counter({
  name: 'livesession_messages_total',
  help: 'Total WebSocket messages processed',
  labelNames: ['direction', 'type'],
});

const playheadUpdatesTotal = new client.Counter({
  name: 'livesession_playhead_updates_total',
  help: 'Number of playback state broadcasts sent',
});

const throttledMessagesTotal = new client.Counter({
  name: 'livesession_throttled_messages_total',
  help: 'Number of messages dropped by throttling',
});

export function registerMetrics(sessionManager) {
  // Register a gauge update function that reads from session manager
  const updateGauges = () => {
    sessionsActive.set(sessionManager.activeSessionCount);
    connectionsActive.set(sessionManager.activeConnectionCount);
  };

  updateGauges();
  const interval = setInterval(updateGauges, 5000);
  interval.unref();

  return {
    sessionsTotal,
    sessionsActive,
    connectionsActive,
    messagesTotal,
    playheadUpdatesTotal,
    throttledMessagesTotal,
    updateGauges,
    registerSession: () => sessionsTotal.inc(),
    onMessage: (direction, type) => messagesTotal.inc({ direction, type }),
    onPlayhead: () => playheadUpdatesTotal.inc(),
    onThrottled: () => throttledMessagesTotal.inc(),
    // Express/Prometheus registry for /metrics endpoint
    register: () => {
      updateGauges();
      return client.register;
    },
  };
}

export { client as promClient };
