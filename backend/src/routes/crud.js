const express = require('express');
const router = express.Router();
const { query } = require('../services/db');
const logger = require('../utils/logger');

// GET /api/crud/:table - Get all records
router.get('/:table', async (req, res) => {
  const { table } = req.params;
  const allowedTables = ['articles', 'article_views', 'article_engagement'];
  
  if (!allowedTables.includes(table)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }

  try {
    const { rows } = await query(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 100`);
    res.json(rows);
  } catch (err) {
    logger.error(`Failed to fetch records from ${table}`, { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/crud/:table - Create a record
router.post('/:table', async (req, res) => {
  const { table } = req.params;
  const data = req.body;

  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');

    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await query(sql, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    logger.error(`Failed to create record in ${table}`, { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/crud/:table/:id - Update a record
router.put('/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  const data = req.body;

  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
    const { rows } = await query(sql, [...values, id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    logger.error(`Failed to update record in ${table}`, { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/crud/:table/:id - Delete a record
router.delete('/:table/:id', async (req, res) => {
  const { table, id } = req.params;

  try {
    const sql = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
    const { rows } = await query(sql, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ success: true, deleted: rows[0] });
  } catch (err) {
    logger.error(`Failed to delete record from ${table}`, { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
