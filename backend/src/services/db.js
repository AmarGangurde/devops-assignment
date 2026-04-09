const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected PostgreSQL pool error', { error: err.message });
    });

    logger.info('PostgreSQL connection pool initialized');
  }
  return pool;
}

/**
 * Execute a SQL query against the PostgreSQL database.
 * @param {string} sql - The SQL query string
 * @param {Array} params - Query parameters for parameterized queries
 * @returns {Promise<{rows: Array, fields: Array}>}
 */
async function query(sql, params = []) {
  const client = await getPool().connect();
  try {
    const result = await client.query(sql, params);
    return { rows: result.rows, fields: result.fields };
  } finally {
    client.release();
  }
}

/**
 * Test the database connection.
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  try {
    const { rows } = await query('SELECT NOW() as now');
    logger.info('Database connection successful', { serverTime: rows[0].now });
    return true;
  } catch (err) {
    logger.error('Database connection failed', { error: err.message });
    return false;
  }
}

/**
 * Get the database schema for use in NL-to-SQL prompts.
 * Returns table names, column names, and types for all user tables.
 */
async function getSchema() {
  const { rows } = await query(`
    SELECT
      t.table_name,
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default
    FROM information_schema.tables t
    JOIN information_schema.columns c
      ON t.table_name = c.table_name
      AND t.table_schema = c.table_schema
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name, c.ordinal_position
  `);

  // Group by table
  const schema = {};
  for (const row of rows) {
    if (!schema[row.table_name]) {
      schema[row.table_name] = [];
    }
    schema[row.table_name].push({
      column: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
    });
  }
  return schema;
}

module.exports = { query, testConnection, getSchema };
