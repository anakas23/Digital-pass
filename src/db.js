const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.RENDER ? false : { rejectUnauthorized: false },
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS passes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      document TEXT NOT NULL,
      issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      status TEXT NOT NULL DEFAULT 'ACTIVE'
    )
  `);
}

//converts a database row to json
function toJson(row) {
  return {
    id: row.id,
    name: row.name,
    document: row.document,
    issuedAt: row.issued_at.toISOString(),
    status: row.status,
  };
}

async function createPass(name, document) {
  const id = crypto.randomUUID(); 
  const r = await pool.query(
    'INSERT INTO passes (id, name, document) VALUES ($1, $2, $3) RETURNING *',
    [id, name, document]
  );
  return toJson(r.rows[0]);
}

//returns null if the pass is non existant
async function getPass(id) {
  const r = await pool.query('SELECT * FROM passes WHERE id::text = $1', [id]);
  return r.rows.length ? toJson(r.rows[0]) : null;
}

async function getAllPasses() {
  const r = await pool.query('SELECT * FROM passes ORDER BY issued_at DESC');
  return r.rows.map(toJson);
}

//true if a pass was changed or deleted, false if non existent
async function cancelPass(id) {
  const r = await pool.query(
    "UPDATE passes SET status = 'CANCELLED' WHERE id::text = $1",
    [id]
  );
  return r.rowCount > 0;
}

async function deletePass(id) {
  const r = await pool.query('DELETE FROM passes WHERE id::text = $1', [id]);
  return r.rowCount > 0;
}

async function getStats() {
  const r = await pool.query(`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active
    FROM passes
  `);
  return r.rows[0];
}

module.exports = {
  initDb,
  createPass,
  getPass,
  getAllPasses,
  cancelPass,
  deletePass,
  getStats,
};