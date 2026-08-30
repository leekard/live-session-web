// health.js — health check HTTP endpoint for the LiveSession sync server.

import http from 'http';

export function createHealthServer({ port = 8081, path = '/health', sessionManager } = {}) {
  const server = http.createServer((req, res) => {
    if (req.url === path && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        uptime: process.uptime(),
        sessions: sessionManager?.activeSessionCount ?? 0,
        connections: sessionManager?.activeConnectionCount ?? 0,
      }));
    } else if (req.url === path) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });

  // /metrics for Prometheus
  if (globalThis.__PROM_CLIENT__) {
    // Already registered elsewhere
  }

  return {
    listen: (p) => new Promise((resolve) => server.listen(p ?? port, resolve)),
    close: () => new Promise((resolve) => server.close(resolve)),
    server,
  };
}

// Create a combined HTTP server that serves both /health and /metrics
export function createHttpServer({ port, sessionManager, metrics, notifyUpdate }) {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/health') {
      const data = {
        ok: true,
        uptime: process.uptime(),
        sessions: sessionManager?.activeSessionCount ?? 0,
        connections: sessionManager?.activeConnectionCount ?? 0,
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } else if (req.url === '/metrics') {
      if (metrics) {
        res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        res.end(await metrics.register.metrics());
      } else {
        res.writeHead(503);
        res.end('metrics not enabled');
      }
    } else if (req.url === '/notify/update' && req.method === 'POST') {
      // Admin/manual endpoint: notify connected desktop hosts that an update is out.
      // Body: { version, url?, message? }
      let body = '';
      for await (const chunk of req) body += chunk;
      let parsed = {};
      try { parsed = JSON.parse(body || '{}'); } catch { parsed = {}; }

      const version = typeof parsed.version === 'string' ? parsed.version : '';
      if (!version) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'version is required' }));
        return;
      }
      const url = typeof parsed.url === 'string' ? parsed.url : '';
      const message = typeof parsed.message === 'string' ? parsed.message : '';

      const sent = typeof notifyUpdate === 'function'
        ? notifyUpdate({ version, url, message })
        : 0;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, notifiedHosts: sent }));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return {
    listen: (p) => new Promise((resolve) => server.listen(p ?? port, resolve)),
    close: () => new Promise((resolve) => server.close(resolve)),
    server,
  };
}
