// Protocol.js — shared message types, validation, and helpers
// Used by both the server and the browser test client.
// The C++ client (SessionSync) mirrors these structures internally.

// ---------------------------------------------------------------------------
// Message types
// ---------------------------------------------------------------------------

// Client -> server registration
// { type: "register", role: "host"|"client", sessionId: string }

// Server -> client welcome (only to newly joined client)
// { type: "welcome", sessionId: string, payload: { ...stateSnapshot } }

// Host -> server -> all clients (readonly state broadcast)
// { type: "track",     payload: { name, bpm, key, scale, countIn, fileCount } }
// { type: "mixer",     payload: { channels: [{ id, file, volume, pan, solo, mute, outputPair, group }] } }
// { type: "playback",  payload: { playing, position, duration, beat, countInBeat } }
// { type: "segments",  payload: [{ id, name, text, start, end, color }] }
//   Segment fields:
//     id    (string) — stable segment identifier
//     name  (string) — short segment label (e.g. "Verse", "Chorus")
//     text  (string) — verbatim segment text/lyrics shown to controllers
//     start (number) — start time in seconds
//     end   (number) — end time in seconds
//     color (string) — hex/CSS color for the segment block
// { type: "groups",    payload: [{ id, name, icon }] }
// { type: "nav",       payload: { blockIndex, trackIndex, trackCount, autoAdvance } }
// { type: "error",     payload: { code, message } }

// Client -> server -> host (commands)
// { type: "cmd", payload: { action: "play" | "pause" | "seek", position?: number } }
// { type: "cmd", payload: { action: "track_prev" | "track_next" } }
// { type: "cmd", payload: { action: "set_countin", value: number } }
// { type: "cmd", payload: { action: "set_vol" | "set_pan" | "set_solo" | "set_mute" | "set_output" | "set_group", channel: number, value } }
// { type: "cmd", payload: { action: "set_auto_advance", value: boolean } }

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MESSAGE_TYPE = Object.freeze({
  REGISTER: 'register',
  WELCOME: 'welcome',
  STATE: 'state', // generic catch — but we use specific types below
  TRACK: 'track',
  MIXER: 'mixer',
  PLAYBACK: 'playback',
  SEGMENTS: 'segments',
  GROUPS: 'groups',
  NAV: 'nav',
  ERROR: 'error',
  CMD: 'cmd',
  PING: 'ping',
  PONG: 'pong',
  GOODBYE: 'goodbye',
  UPDATE_AVAILABLE: 'update_available',
});

const ROLE = Object.freeze({
  HOST: 'host',
  CLIENT: 'client',
});

const ERROR_CODE = Object.freeze({
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_TAKEN: 'SESSION_TAKEN',
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  THROTTLED: 'THROTTLED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_HOST: 'NOT_HOST',
  NOT_INITIALIZED: 'NOT_INITIALIZED',
});

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

function isString(v) { return typeof v === 'string'; }
function isNumber(v) { return typeof v === 'number' && Number.isFinite(v); }
function isBoolean(v) { return typeof v === 'boolean'; }
function isArray(v) { return Array.isArray(v); }

function validateRegister(msg) {
  if (msg.type !== MESSAGE_TYPE.REGISTER) return { ok: false, error: 'type must be "register"' };
  if (!isString(msg.role) || (msg.role !== ROLE.HOST && msg.role !== ROLE.CLIENT))
    return { ok: false, error: 'role must be "host" or "client"' };
  // Host can omit sessionId to create a NEW session; clients must always provide one.
  if (msg.role === ROLE.HOST) {
    if (msg.sessionId !== undefined && msg.sessionId !== null && !isString(msg.sessionId))
      return { ok: false, error: 'sessionId must be a string for hosts' };
  } else if (!isString(msg.sessionId) || msg.sessionId.length === 0) {
    return { ok: false, error: 'sessionId must be a non-empty string for clients' };
  }
  return { ok: true };
}

function validateCmd(msg) {
  if (msg.type !== MESSAGE_TYPE.CMD) return { ok: false, error: 'type must be "cmd"' };
  const p = msg.payload;
  if (!p || typeof p !== 'object') return { ok: false, error: 'payload must be an object' };
  if (!isString(p.action) || p.action.length === 0) return { ok: false, error: 'payload.action required' };

  const transportCmds = ['play', 'pause', 'track_prev', 'track_next'];
  const seekCmds = ['seek'];
  const setterCmds = ['set_countin', 'set_vol', 'set_pan', 'set_solo', 'set_mute', 'set_output', 'set_group', 'set_auto_advance'];

  if (transportCmds.includes(p.action)) return { ok: true };

  if (seekCmds.includes(p.action)) {
    if (!isNumber(p.position)) return { ok: false, error: 'position must be a number' };
    return { ok: true };
  }

  if (setterCmds.includes(p.action)) {
    if (!isNumber(p.channel) || p.channel < 0) return { ok: false, error: 'channel must be a non-negative number' };
    // set_countin: value is number
    // set_vol, set_pan: value is number
    // set_solo, set_mute, set_auto_advance: value is boolean
    // set_output: value is number (pair index)
    // set_group: value is string
    if (p.action === 'set_countin' || p.action === 'set_vol' || p.action === 'set_pan') {
      if (!isNumber(p.value)) return { ok: false, error: 'value must be a number' };
    } else if (p.action === 'set_solo' || p.action === 'set_mute' || p.action === 'set_auto_advance') {
      if (!isBoolean(p.value)) return { ok: false, error: 'value must be a boolean' };
    } else if (p.action === 'set_output') {
      if (!isNumber(p.value)) return { ok: false, error: 'value must be a number' };
    } else if (p.action === 'set_group') {
      if (!isString(p.value)) return { ok: false, error: 'value must be a string' };
    }
    return { ok: true };
  }

  return { ok: false, error: `unknown action: ${p.action}` };
}

function validatePlayback(msg) {
  if (msg.type !== MESSAGE_TYPE.PLAYBACK) return { ok: false, error: 'type must be "playback"' };
  const p = msg.payload;
  if (!p || typeof p !== 'object') return { ok: false, error: 'payload must be an object' };
  if (!isBoolean(p.playing)) return { ok: false, error: 'playing must be boolean' };
  if (!isNumber(p.position)) return { ok: false, error: 'position must be a number' };
  if (!isNumber(p.duration)) return { ok: false, error: 'duration must be a number' };
  if (!isNumber(p.beat)) return { ok: false, error: 'beat must be a number' };
  if (!isNumber(p.countInBeat)) return { ok: false, error: 'countInBeat must be a number' };
  return { ok: true };
}

function validateMessage(msg) {
  if (!msg || typeof msg !== 'object' || !isString(msg.type))
    return { ok: false, error: 'message must be an object with a string type' };

  switch (msg.type) {
    case MESSAGE_TYPE.REGISTER:   return validateRegister(msg);
    case MESSAGE_TYPE.CMD:        return validateCmd(msg);
    case MESSAGE_TYPE.PLAYBACK:   return validatePlayback(msg);
    case MESSAGE_TYPE.TRACK:
    case MESSAGE_TYPE.MIXER:
    case MESSAGE_TYPE.SEGMENTS:
    case MESSAGE_TYPE.GROUPS:
    case MESSAGE_TYPE.NAV:
    case MESSAGE_TYPE.PING:
    case MESSAGE_TYPE.PONG:
    case MESSAGE_TYPE.GOODBYE:
      // Structure validated loosely — payload presence checked by consumers
      return { ok: true };
    default:
      return { ok: false, error: `unknown message type: ${msg.type}` };
  }
}

// ---------------------------------------------------------------------------
// Builders (used by browser client and server-internal responses)
// ---------------------------------------------------------------------------

function buildRegister(role, sessionId) {
  return { type: MESSAGE_TYPE.REGISTER, role, sessionId };
}

function buildCmd(action, extra = {}) {
  return { type: MESSAGE_TYPE.CMD, payload: { action, ...extra } };
}

function buildError(code, message) {
  return { type: MESSAGE_TYPE.ERROR, payload: { code, message } };
}

function buildPing() {
  return { type: MESSAGE_TYPE.PING };
}

function buildPong() {
  return { type: MESSAGE_TYPE.PONG };
}

function buildGoodbye() {
  return { type: MESSAGE_TYPE.GOODBYE };
}

// ---------------------------------------------------------------------------
// Session ID generation
// ---------------------------------------------------------------------------

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — easy to read

function generateSessionId(length = 6) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return result;
}

// ---------------------------------------------------------------------------
// Throttling helper for high-frequency state (playback)
// ---------------------------------------------------------------------------

class ThrottleTimer {
  constructor(intervalMs) {
    this.intervalMs = intervalMs;
    this._lastTime = 0;
    this._pending = null;
  }

  /**
   * call(fn) — fn will be invoked after `intervalMs` since the last call.
   * If called too soon, the last invocation is coalesced (replaced).
   */
  call(fn) {
    const now = Date.now();
    const elapsed = now - this._lastTime;
    if (elapsed >= this.intervalMs) {
      this._lastTime = now;
      fn();
    } else {
      // debounce: only the latest fn runs
      if (this._pending) clearTimeout(this._pending);
      const remaining = this.intervalMs - elapsed;
      this._pending = setTimeout(() => {
        this._lastTime = Date.now();
        this._pending = null;
        fn();
      }, remaining);
    }
  }

  reset() {
    this._lastTime = 0;
    if (this._pending) clearTimeout(this._pending);
    this._pending = null;
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  MESSAGE_TYPE,
  ROLE,
  ERROR_CODE,
  validateMessage,
  validateRegister,
  validateCmd,
  validatePlayback,
  buildRegister,
  buildCmd,
  buildError,
  buildPing,
  buildPong,
  buildGoodbye,
  generateSessionId,
  ThrottleTimer,
};
