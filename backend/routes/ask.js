// routes/ask.js
const express = require('express');
const { financeDb, appDb } = require('../config/db');
const { generateSqlSchemaAware } = require('../services/llm');
const { validateSql } = require('../services/sqlValidator');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.post('/ask', requireAuth, async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'question is required' });
  }

  try {
    const sql = await generateSqlSchemaAware(question);

    const { valid, error } = validateSql(sql);
    if (!valid) {
      return res.status(400).json({ error: `Invalid query generated: ${error}`, sql });
    }

    const rows = financeDb.prepare(sql).all();

    appDb.prepare(`
      INSERT INTO history (user_id, question, generated_sql)
      VALUES (?, ?, ?)
    `).run(req.user.userId, question, sql);

    res.json({ question, sql, results: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to process question', details: err.message });
  }
});

module.exports = router;