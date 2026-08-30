import pg from 'pg';
import { config } from '../config.js';

export function createPool(connectionString: string = config.db.connectionString): pg.Pool {
  return new pg.Pool({ connectionString });
}

export const pool = createPool();
