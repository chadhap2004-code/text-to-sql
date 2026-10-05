// routes/history.js
const express = require('express');
const { appDb } = require('../config/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/history', requireAuth, (req, res) => {
  const rows = appDb.prepare(`
    SELECT id, question, generated_sql, created_at
    FROM history
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.user.userId);

  res.json({ history: rows });
});

module.exports = router;