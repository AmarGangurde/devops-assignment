const express = require('express');
const router = express.Router();
const { nlToSql } = require('../services/nlToSql');
const { query } = require('../services/db');
const { formatResponse } = require('../services/formatter');
const { chatRequestsTotal, chatLatency } = require('../middleware/metrics');
const logger = require('../utils/logger');

// POST /api/chat
router.post('/chat', async (req, res) => {
  const end = chatLatency.startTimer();
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    chatRequestsTotal.inc({ status: 'error' });
    end({ status: 'error' });
    return res.status(400).json({ error: 'message field is required' });
  }

  try {
    logger.info('Chat request received', { message });

    // Step 1: NL → SQL
    const { sql, chartType, explanation } = await nlToSql(message, history);
    logger.info('SQL generated', { sql, chartType });

    // Step 2: Execute SQL
    const { rows, fields } = await query(sql);
    logger.info('Query executed', { rowCount: rows.length });

    // Step 3: Format response
    const formatted = formatResponse(rows, fields, chartType, explanation, sql);

    chatRequestsTotal.inc({ status: 'success' });
    end({ status: 'success' });

    return res.json({
      success: true,
      message: formatted.summary,
      result: formatted,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Chat request failed', { error: err.message, stack: err.stack });
    chatRequestsTotal.inc({ status: 'error' });
    end({ status: 'error' });
    return res.status(500).json({
      error: err.message || 'Failed to process query',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/schema - return current DB schema (useful for frontend hints)
router.get('/schema', async (req, res) => {
  try {
    const { getSchema } = require('../services/db');
    const schema = await getSchema();
    res.json({ schema, timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error('Schema fetch failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
