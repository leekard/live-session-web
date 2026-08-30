// SessionManager.js — manages WebSocket sessions (rooms) with TTL cleanup.

import { generateSessionId } from './protocol.js';

const DEFAULT_TTL_MS = 7_200_000; // 2 hours

class Session {
  constructor(sessionId, ttlMs) {
    this.sessionId = sessionId;
    this.ttlMs = ttlMs;
    this.createdAt = Date.now();
    this.expiresAt = this.createdAt + ttlMs;

    /** @type {import('ws').WebSocket | null} */
    this.host = null;

    /** @type {Set<import('ws').WebSocket>} */
    this.clients = new Set();

    /** @type {Map<string, any> | null} — last known full state snapshot from host */
    this.stateSnapshot = null;
  }

  get age() { return Date.now() - this.createdAt; }
  get isAlive() { return Date.now() < this.expiresAt; }
  get isExpired() { return !this.isAlive; }
  get clientCount() { return this.clients.size; }
  get isActive() { return this.host !== null && this.clients.size > 0; }

  touch() {
    this.expiresAt = Date.now() + this.ttlMs;
  }

  registerHost(ws) {
    this.host = ws;
    this.touch();
    ws.sessionId = this.sessionId;
    ws.role = 'host';
  }

  registerClient(ws) {
    this.clients.add(ws);
    this.touch();
    ws.sessionId = this.sessionId;
    ws.role = 'client';

    // Tag each client with its own throttle timers so one client's
    // flood can't affect another's sync.
    if (!ws._throttleTimers) ws._throttleTimers = new Map();
  }

  unregisterHost() {
    if (this.host) {
      this.host.sessionId = null;
      this.host = null;
    }
  }

  removeClient(ws) {
    this.clients.delete(ws);
    ws.sessionId = null;
  }

  /** @returns {{type: string, payload?: any, role?: string} | null} */
  getSnapshot() {
    return this.stateSnapshot;
  }

  /** @param {{type: string, payload?: any}} msg — store latest snapshot for late-joining clients */
  updateSnapshot(msg) {
    // We keep the latest state messages so a late-joining client gets the current state.
    // Only cache "state" type messages (track/mixer/playback/segments/groups/nav),
    // not one-off control messages.
    if (msg.type === 'track' || msg.type === 'mixer' || msg.type === 'segments' ||
        msg.type === 'groups' || msg.type === 'nav') {
      if (!this.stateSnapshot) this.stateSnapshot = {};
      this.stateSnapshot[msg.type] = msg;
    }
  }
}

export default class SessionManager {
  constructor(ttlMs = DEFAULT_TTL_MS) {
    /** @type {Map<string, Session>} */
    this.sessions = new Map();
    this.ttlMs = ttlMs;
    this._cleanupInterval = setInterval(() => this._cleanup(), 30_000);
    this._cleanupInterval.unref();
  }

  /**
   * Create a new session (or reclaim an existing one if sessionId is provided).
   * Returns the session object.
   */
  createSession(requestedId = null) {
    let id = requestedId;
    // If requesting a specific ID that exists and has no host, reclaim it
    if (id && this.sessions.has(id)) {
      const existing = this.sessions.get(id);
      if (!existing.host) {
        existing.host = null; // will be set by registerHost
        existing.touch();
        return existing;
      }
      // ID taken by active host — generate a new one
      id = null;
    }

    // Generate unique ID if not provided or collides
    if (!id) {
      do {
        id = generateSessionId();
      } while (this.sessions.has(id));
    }

    const session = new Session(id, this.ttlMs);
    this.sessions.set(id, session);
    return session;
  }

  /**
   * Get an existing session by ID. Returns null if not found or expired.
   */
  getSession(sessionId) {
    if (!sessionId) return null;
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (session.isExpired) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  /**
   * Register a host for a session. Creates the session if it doesn't exist
   * and the sessionId is not already taken by another host.
   */
  registerHost(ws, sessionId = null) {
    let session;
    if (sessionId) {
      session = this.getSession(sessionId);
      if (session && session.host) {
        return { ok: false, error: 'SESSION_TAKEN', session: null };
      }
      if (!session) {
        session = this.createSession(sessionId);
      }
    } else {
      session = this.createSession();
    }
    session.registerHost(ws);
    return { ok: true, session };
  }

  /**
   * Register a client (controller) for an existing session.
   * Returns { ok, session, snapshot } or { ok: false, error }.
   */
  registerClient(ws, sessionId) {
    const session = this.getSession(sessionId);
    if (!session) {
      return { ok: false, error: 'SESSION_NOT_FOUND', session: null, snapshot: null };
    }
    if (!session.host) {
      return { ok: false, error: 'NOT_INITIALIZED', session: null, snapshot: null };
    }
    session.registerClient(ws);
    return { ok: true, session, snapshot: session.getSnapshot() };
  }

  /**
   * Broadcast a message from the host to all connected clients.
   */
  broadcastFromHost(sessionId, msg) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.host) return false;

    session.updateSnapshot(msg);

    for (const client of session.clients) {
      if (client.readyState === client.OPEN) {
        try {
          client.send(JSON.stringify(msg));
        } catch {
          // client disconnected — will be cleaned up by close handler
        }
      }
    }
    return true;
  }

  /**
   * Forward a command from a client to the host.
   */
  forwardToClient(sessionId, msg) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (session.host && session.host.readyState === session.host.OPEN) {
      try {
        session.host.send(JSON.stringify(msg));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Ping all clients in a session (used for keepalive).
   */
  pingSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    const payload = JSON.stringify({ type: 'ping', ts: Date.now() });
    for (const ws of [session.host, ...session.clients]) {
      if (ws && ws.readyState === ws.OPEN) {
        try { ws.send(payload); } catch {}
      }
    }
  }

  /**
   * Remove a connection from any session.
   */
  /**
   * Send a payload to every connected host across all active sessions.
   * Returns the number of hosts that received it.
   */
  notifyAllHosts(msg) {
    let count = 0;
    const payload = typeof msg === 'string' ? msg : JSON.stringify(msg);
    for (const session of this.sessions.values()) {
      if (session.host && session.host.readyState === session.host.OPEN) {
        try { session.host.send(payload); count++; } catch {}
      }
    }
    return count;
  }

  removeConnection(ws) {
    const { sessionId, role } = ws;
    if (!sessionId) return false;

    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (role === 'host') {
      session.unregisterHost();
      // If no clients left, clean up the session entirely
      if (session.clients.size === 0) {
        this.sessions.delete(sessionId);
      } else {
        // Notify clients that host disconnected
        for (const client of session.clients) {
          if (client.readyState === client.OPEN) {
            try {
              client.send(JSON.stringify({
                type: 'error',
                payload: { code: 'HOST_DISCONNECTED', message: 'Host disconnected' }
              }));
            } catch {}
          }
        }
      }
    } else if (role === 'client') {
      session.removeClient(ws);
    }

    ws.sessionId = null;
    ws.role = null;
    return true;
  }

  _cleanup() {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (session.isExpired || (!session.host && session.clients.size === 0)) {
        this.sessions.delete(id);
      }
    }
  }

  get activeSessionCount() {
    let count = 0;
    for (const s of this.sessions.values()) {
      if (s.host) count++;
    }
    return count;
  }

  get activeConnectionCount() {
    let count = 0;
    for (const s of this.sessions.values()) {
      if (s.host) count++;
      count += s.clients.size;
    }
    return count;
  }

  close() {
    clearInterval(this._cleanupInterval);
    for (const session of this.sessions.values()) {
      for (const ws of [session.host, ...session.clients]) {
        if (ws) ws.terminate();
      }
    }
    this.sessions.clear();
  }
}
