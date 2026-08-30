import {
  validateMessage,
  validateRegister,
  validateCmd,
  validatePlayback,
  MESSAGE_TYPE,
  generateSessionId,
  ThrottleTimer,
} from '../protocol.js';

describe('validateRegister', () => {
  test('host can register without a sessionId (create new session)', () => {
    const res = validateRegister({ type: 'register', role: 'host' });
    expect(res.ok).toBe(true);
  });

  test('host can reclaim an existing session', () => {
    const res = validateRegister({ type: 'register', role: 'host', sessionId: 'ABC123' });
    expect(res.ok).toBe(true);
  });

  test('host rejects non-string sessionId', () => {
    const res = validateRegister({ type: 'register', role: 'host', sessionId: 123 });
    expect(res.ok).toBe(false);
  });

  test('client requires a non-empty sessionId', () => {
    expect(validateRegister({ type: 'register', role: 'client' }).ok).toBe(false);
    expect(validateRegister({ type: 'register', role: 'client', sessionId: '' }).ok).toBe(false);
    expect(validateRegister({ type: 'register', role: 'client', sessionId: 'XYZ789' }).ok).toBe(true);
  });

  test('rejects unknown role', () => {
    expect(validateRegister({ type: 'register', role: 'admin', sessionId: 'ABC123' }).ok).toBe(false);
  });
});

describe('generateSessionId', () => {
  test('produces 6-char IDs from the safe charset', () => {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 100; i++) {
      const id = generateSessionId();
      expect(id).toHaveLength(6);
      for (const ch of id) expect(charset).toContain(ch);
    }
  });

  test('custom length is honoured', () => {
    expect(generateSessionId(8)).toHaveLength(8);
  });
});

describe('validateCmd', () => {
  test('transport commands pass', () => {
    for (const a of ['play', 'pause', 'track_prev', 'track_next']) {
      expect(validateCmd({ type: 'cmd', payload: { action: a } }).ok).toBe(true);
    }
  });

  test('seek requires numeric position', () => {
    expect(validateCmd({ type: 'cmd', payload: { action: 'seek', position: 12.5 } }).ok).toBe(true);
    expect(validateCmd({ type: 'cmd', payload: { action: 'seek' } }).ok).toBe(false);
  });

  test('set_vol requires numeric value and channel', () => {
    expect(validateCmd({ type: 'cmd', payload: { action: 'set_vol', channel: 1, value: 80 } }).ok).toBe(true);
    expect(validateCmd({ type: 'cmd', payload: { action: 'set_vol', channel: 0, value: 'loud' } }).ok).toBe(false);
  });

  test('set_mute requires boolean value', () => {
    expect(validateCmd({ type: 'cmd', payload: { action: 'set_mute', channel: 0, value: true } }).ok).toBe(true);
    expect(validateCmd({ type: 'cmd', payload: { action: 'set_mute', channel: 0, value: 1 } }).ok).toBe(false);
  });

  test('set_group requires string value', () => {
    expect(validateCmd({ type: 'cmd', payload: { action: 'set_group', channel: 0, value: 'Drums' } }).ok).toBe(true);
    expect(validateCmd({ type: 'cmd', payload: { action: 'set_group', channel: 0, value: 5 } }).ok).toBe(false);
  });

  test('rejects unknown action', () => {
    expect(validateCmd({ type: 'cmd', payload: { action: 'rewind' } }).ok).toBe(false);
  });
});

describe('validatePlayback', () => {
  test('valid playback message passes', () => {
    expect(validatePlayback({
      type: 'playback',
      payload: { playing: true, position: 1.5, duration: 120, beat: 2, countInBeat: 0 },
    }).ok).toBe(true);
  });

  test('missing fields are rejected', () => {
    expect(validatePlayback({ type: 'playback', payload: { playing: true } }).ok).toBe(false);
  });
});

describe('ThrottleTimer', () => {
  test('coalesces rapid calls to a single execution', async () => {
    const timer = new ThrottleTimer(33);
    let count = 0;
    for (let i = 0; i < 10; i++) timer.call(() => count++);
    await new Promise((r) => setTimeout(r, 60));
    expect(count).toBeLessThanOrEqual(2);
  });

  test('reset() cancels a pending (debounced) call', async () => {
    const timer = new ThrottleTimer(50);
    let count = 0;
    timer.call(() => count++); // first call executes immediately
    expect(count).toBe(1);
    timer.call(() => count++); // this one is scheduled to fire later
    timer.reset();             // cancels the pending call
    await new Promise((r) => setTimeout(r, 70));
    expect(count).toBe(1);
  });

  test('unknown top-level types are rejected by validateMessage', () => {
    expect(validateMessage({ type: 'teleport' }).ok).toBe(false);
  });
});
