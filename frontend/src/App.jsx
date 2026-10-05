import { useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import './App.css';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

  function handleAuth(newToken) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setToken(null);
  }

  if (!token) {
    return authView === 'login'
      ? <Login onAuth={handleAuth} switchToRegister={() => setAuthView('register')} />
      : <Register onAuth={handleAuth} switchToLogin={() => setAuthView('login')} />;
  }

  return <Chat token={token} onLogout={handleLogout} />;
}