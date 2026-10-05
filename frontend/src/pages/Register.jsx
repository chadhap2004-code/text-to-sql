// src/pages/Register.jsx
import { useState } from 'react';
import { register, verifyEmail, resendOtp } from '../api';

export default function Register({ onAuth, switchToLogin }) {
  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email, password);
      setStep('verify');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await verifyEmail(email, otp);
      onAuth(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    try {
      await resendOtp(email);
      setError('OTP resent — check your inbox.');
    } catch (err) {
      setError(err.message);
    }
  }

  if (step === 'verify') {
    return (
      <form className="auth-form" onSubmit={handleVerify}>
        <h2>Verify your email</h2>
        <p className="muted">OTP sent to {email}</p>
        <input placeholder="6-digit code" value={otp} onChange={e => setOtp(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</button>
        <button type="button" className="link-btn" onClick={handleResend}>Resend OTP</button>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleRegister}>
      <h2>Register</h2>
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
      <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
      <button type="button" className="link-btn" onClick={switchToLogin}>Already have an account? Login</button>
    </form>
  );
}