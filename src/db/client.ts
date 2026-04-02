import * as pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

export async function query(text: string, params?: any[]) {
  const result = await pool.query(text, params);
  return result.rows;
}

export async function queryOne(text: string, params?: any[]) {
  const result = await pool.query(text, params);
  return result.rows[0] || null;
}

export default pool;
