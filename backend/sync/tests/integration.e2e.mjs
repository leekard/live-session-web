// Manual end-to-end integration test.
//
// Verifies the full WebSocket protocol flow between a live sync server, a host
// (desktop app) and a client (mobile/browser controller).
//
// Run against a running server:
//   1. Start the server:        cd server && npm start        (or: node index.js)
//   2. Run this test:           node tests/integration.e2e.mjs
//
// The desktop C++ host (SessionSync) and the browser controller
// (tests/browser_client.html) speak the exact same protocol exercised here.

import { WebSocket } from 'ws';

const WS_URL = process.env.WS_URL || 'ws://localhost:8080';
const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function check(name, cond, extra = '') {
  results.push({ name, ok: !!cond });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  -> ' + extra : ''}`);
}

function waitMsg(ws, type, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting for ${type}`)), timeout);
    const handler = (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === type) { clearTimeout(t); ws.off('message', handler); resolve(msg); }
    };
    ws.on('message', handler);
  });
}

async function connect() {
  const ws = new WebSocket(WS_URL);
  await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });
  return ws;
}

try {
  // 1. Host creates a new session (no sessionId -> server assigns one)
  const host = await connect();
  host.send(JSON.stringify({ type: 'register', role: 'host' }));
  const created = await waitMsg(host, 'session_created');
  const sessionId = created.payload.sessionId;
  check('host gets session_created', !!sessionId && /^[A-Z2-9]{6}$/.test(sessionId), `id=${sessionId}`);

  // 2. Client joins the created session
  const client = await connect();
  client.send(JSON.stringify({ type: 'register', role: 'client', sessionId }));
  const welcome = await waitMsg(client, 'welcome');
  check('client gets welcome', welcome.payload.sessionId === sessionId);

  // 3. Host publishes state -> client receives it
  host.send(JSON.stringify({ type: 'track', payload: { name: 'Song A', bpm: 128, key: 'C', scale: 'Major', countIn: 4, fileCount: 3 } }));
  const trackMsg = await waitMsg(client, 'track');
  check('client receives track', trackMsg.payload.name === 'Song A' && trackMsg.payload.bpm === 128);

  host.send(JSON.stringify({ type: 'mixer', payload: { channels: [{ file: 'a.wav', volume: 92, pan: 0, solo: false, mute: false, outputPair: 0, group: 'Drums' }] } }));
  const mixerMsg = await waitMsg(client, 'mixer');
  check('client receives mixer', mixerMsg.payload.channels[0].volume === 92);

  host.send(JSON.stringify({ type: 'nav', payload: { blockIndex: 0, trackIndex: 1, trackCount: 5, autoAdvance: true } }));
  const navMsg = await waitMsg(client, 'nav');
  check('client receives nav', navMsg.payload.trackCount === 5 && navMsg.payload.autoAdvance === true);

  // 4. Client sends commands -> host receives them
  client.send(JSON.stringify({ type: 'cmd', payload: { action: 'play' } }));
  const cmd = await waitMsg(host, 'cmd_from_client');
  check('host receives cmd_from_client', cmd.payload.action === 'play');

  client.send(JSON.stringify({ type: 'cmd', payload: { action: 'set_vol', channel: 1, value: 55 } }));
  const cmd2 = await waitMsg(host, 'cmd_from_client');
  check('host receives mixer cmd', cmd2.payload.action === 'set_vol' && cmd2.payload.value === 55);

  // 5. Unknown session -> error
  const bad = await connect();
  bad.send(JSON.stringify({ type: 'register', role: 'client', sessionId: 'ZZZZZZ' }));
  const errMsg = await waitMsg(bad, 'error');
  check('bad session -> error', errMsg.payload.code === 'SESSION_NOT_FOUND');
  await sleep(200);

  // 6. Playback throttled to ~30Hz (many sends -> few delivered)
  host.send(JSON.stringify({ type: 'playback', payload: { playing: true, position: 0, duration: 100, beat: 1, countInBeat: 0 } }));
  for (let i = 1; i <= 10; i++)
    host.send(JSON.stringify({ type: 'playback', payload: { playing: true, position: i, duration: 100, beat: i % 4, countInBeat: 0 } }));
  let playbackReceived = 0;
  const collect = (raw) => { const m = JSON.parse(raw.toString()); if (m.type === 'playback') playbackReceived++; };
  client.on('message', collect);
  await sleep(150);
  client.off('message', collect);
  check('playback throttled (< 11 received)', playbackReceived < 11, `received=${playbackReceived}`);

  // 7. Unregistered socket sending state -> NOT_INITIALIZED
  const anon = await connect();
  anon.send(JSON.stringify({ type: 'track', payload: { name: 'x', bpm: 1, key: 'C', scale: 'M', countIn: 0, fileCount: 1 } }));
  const notInit = await waitMsg(anon, 'error');
  check('unregistered -> not initialized', notInit.payload.code === 'NOT_INITIALIZED');

  // 8. Malformed JSON -> INVALID_MESSAGE
  const anon2 = await connect();
  anon2.send('not json');
  const invalid = await waitMsg(anon2, 'error');
  check('invalid json -> INVALID_MESSAGE', invalid.payload.code === 'INVALID_MESSAGE');

  bad.close(); anon.close(); anon2.close(); client.close(); host.close();
} catch (e) {
  console.error('FAILURE AT STEP:', e && e.message);
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n==== ${results.length - failed}/${results.length} passed ====`);
process.exit(failed ? 1 : 0);
