import SessionManager from '../SessionManager.js';

const OPEN = 1;
function makeWs() {
  const sent = [];
  return {
    readyState: OPEN,
    OPEN, // ws instances inherit this from WebSocket.prototype
    sessionId: null,
    role: null,
    sent,
    send(data) { sent.push(JSON.parse(data)); },
    terminate() {},
    close() {},
  };
}

describe('SessionManager', () => {
  let manager;
  beforeEach(() => { manager = new SessionManager(60_000); });
  afterEach(() => { manager.close(); });

  test('registerHost with no id creates a session and assigns an id', () => {
    const ws = makeWs();
    const { ok, session } = manager.registerHost(ws);
    expect(ok).toBe(true);
    expect(session.sessionId).toMatch(/^[A-Z2-9]{6}$/);
    expect(ws.sessionId).toBe(session.sessionId);
    expect(ws.role).toBe('host');
  });

  test('registerClient fails for an unknown session', () => {
    const ws = makeWs();
    const { ok, error } = manager.registerClient(ws, 'NOPE99');
    expect(ok).toBe(false);
    expect(error).toBe('SESSION_NOT_FOUND');
  });

  test('client join/host disconnect lifecycle', () => {
    const host = makeWs();
    const { session } = manager.registerHost(host);

    const client = makeWs();
    const res = manager.registerClient(client, session.sessionId);
    expect(res.ok).toBe(true);
    expect(client.role).toBe('client');

    // host disconnects but a client remains -> session stays (host becomes null)
    manager.removeConnection(host);
    const afterHostLeft = manager.getSession(session.sessionId);
    expect(afterHostLeft).not.toBeNull();
    expect(afterHostLeft.host).toBeNull();

    // client leaves too -> session is emptied and removed by the background cleanup
    manager.removeConnection(client);
    const emptied = manager.getSession(session.sessionId);
    expect(emptied).not.toBeNull();
    expect(emptied.host).toBeNull();
    expect(emptied.clientCount).toBe(0);
    manager._cleanup();
    expect(manager.getSession(session.sessionId)).toBeNull();
  });

  test('broadcastFromHost forwards state to clients', () => {
    const host = makeWs();
    const { session } = manager.registerHost(host);
    const client = makeWs();
    manager.registerClient(client, session.sessionId);

    manager.broadcastFromHost(session.sessionId, { type: 'track', payload: { name: 'A', bpm: 120, key: 'C', scale: 'Major', countIn: 4, fileCount: 1 } });

    const forwarded = client.sent.find((m) => m.type === 'track');
    expect(forwarded.payload.bpm).toBe(120);
  });

  test('broadcastFromHost updates the snapshot for late joiners', () => {
    const host = makeWs();
    const { session } = manager.registerHost(host);
    manager.broadcastFromHost(session.sessionId, { type: 'nav', payload: { blockIndex: 0, trackIndex: 1, trackCount: 4, autoAdvance: true } });

    const late = makeWs();
    const res = manager.registerClient(late, session.sessionId);
    expect(res.snapshot.nav.payload.trackCount).toBe(4);
  });

  test('forwardToClient sends command to the host', () => {
    const host = makeWs();
    const { session } = manager.registerHost(host);
    const client = makeWs();
    manager.registerClient(client, session.sessionId);

    manager.forwardToClient(session.sessionId, { type: 'cmd_from_client', payload: { action: 'play' } });
    expect(host.sent.find((m) => m.type === 'cmd_from_client').payload.action).toBe('play');
  });

  test('second host registering same id is rejected as SESSION_TAKEN', () => {
    const host1 = makeWs();
    const { session } = manager.registerHost(host1);
    const host2 = makeWs();
    const { ok, error } = manager.registerHost(host2, session.sessionId);
    expect(ok).toBe(false);
    expect(error).toBe('SESSION_TAKEN');
  });

  test('expired sessions are removed by cleanup', () => {
    const ws = makeWs();
    const { session } = manager.registerHost(ws, 'BBBBBB');
    // force expiry
    const s = manager.getSession('BBBBBB');
    s.expiresAt = Date.now() - 1000;
    manager._cleanup();
    expect(manager.getSession('BBBBBB')).toBeNull();
  });

  test('getSession returns null for unknown id', () => {
    expect(manager.getSession('UNKNOWN')).toBeNull();
  });
});
