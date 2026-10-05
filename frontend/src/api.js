// src/api.js
const BASE_URL = 'http://localhost:3000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export function register(username, email, password) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) });
}

export function verifyEmail(email, otp) {
  return request('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, otp }) });
}

export function resendOtp(email) {
  return request('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) });
}

export function login(username, password) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export function askQuestion(token, question) {
  return request('/ask', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ question }),
  });
}

export function getHistory(token) {
  return request('/history', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}