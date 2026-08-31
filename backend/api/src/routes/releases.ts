import { FastifyPluginAsync } from 'fastify';
import { pool } from '../db/pool.js';
import { config } from '../config.js';

// Public + desktop endpoints for releases. The desktop polls /latest on startup
// and the /downloads/:file route serves the uploaded installer binary.
const releasesRoutes: FastifyPluginAsync = async (app) => {
  // Desktop: current latest published release (no auth required).
  app.get('/latest', async (request, reply) => {
    const res = await pool.query(
      `SELECT id, version, file_name, file_size, notes, published_at FROM releases
       WHERE published = true
       ORDER BY published_at DESC NULLS LAST, id DESC
       LIMIT 1`
    );
    if (res.rowCount === 0) {
      return reply.code(404).send({ ok: false, error: 'NO_RELEASE' });
    }
    const r = res.rows[0];
    return reply.send({
      ok: true,
      release: {
        id: r.id,
        version: r.version,
        file_name: r.file_name,
        file_size: r.file_size,
        notes: r.notes,
        publishedAt: r.published_at,
        url: `${config.webOrigin}/api/downloads/${encodeURIComponent(r.file_name)}`,
      },
    });
  });
};

export default releasesRoutes;
