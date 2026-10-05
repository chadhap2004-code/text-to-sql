const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { appDb } = require('../config/db');
const { sendOtpEmail } = require('../services/email');

const router = express.Router();
const SALT_ROUNDS = 10;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password required' });
  }

  try {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    appDb.prepare(`
      INSERT INTO users (username, email, password_hash, otp_code, otp_expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(username, email, password_hash, otp, expiresAt);

    await sendOtpEmail(email, otp);

    res.status(201).json({ message: 'OTP sent to email. Verify to activate account.' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'username or email already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'registration failed' });
  }
});

router.post('/verify-email', (req, res) => {
  const { email, otp } = req.body;
  const user = appDb.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) return res.status(404).json({ error: 'user not found' });
  if (user.is_verified) return res.status(400).json({ error: 'already verified' });
  if (user.otp_code !== otp) return res.status(400).json({ error: 'invalid OTP' });
  if (new Date(user.otp_expires_at) < new Date()) {
    return res.status(400).json({ error: 'OTP expired, request a new one' });
  }

  appDb.prepare(`
    UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL
    WHERE id = ?
  `).run(user.id);

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.json({ message: 'email verified', token });
});

router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  const user = appDb.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) return res.status(404).json({ error: 'user not found' });
  if (user.is_verified) return res.status(400).json({ error: 'already verified' });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  appDb.prepare('UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?')
    .run(otp, expiresAt, user.id);

  await sendOtpEmail(email, otp);
  res.json({ message: 'OTP resent' });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  const user = appDb.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'invalid credentials' });

  if (!user.is_verified) {
    return res.status(403).json({ error: 'email not verified' });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.json({ token });
});

module.exports = router;

