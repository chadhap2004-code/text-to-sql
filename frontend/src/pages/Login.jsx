// src/pages/Login.jsx
import { useState } from 'react';
import { login } from '../api';

export default function Login({ onAuth, switchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      onAuth(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      <button type="button" className="link-btn" onClick={switchToRegister}>Need an account? Register</button>
    </form>
  );
}