// src/pages/Chat.jsx
import { useState } from 'react';
import { askQuestion } from '../api';
import ResultTable from '../components/ResultTable';
import HistoryPanel from '../components/HistoryPanel';

export default function Chat({ token, onLogout }) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleAsk(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await askQuestion(token, question);
      setResult(data);
      setRefreshKey(k => k + 1); // triggers history refresh
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-layout">
      <aside>
        <HistoryPanel token={token} refreshKey={refreshKey} />
        <button className="link-btn" onClick={onLogout}>Logout</button>
      </aside>

      <main>
        <h2>Ask your data</h2>
        <form onSubmit={handleAsk}>
          <input
            placeholder='e.g. "top 5 merchants by total spend"'
            value={question}
            onChange={e => setQuestion(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>{loading ? 'Thinking...' : 'Ask'}</button>
        </form>

        {error && <p className="error">{error}</p>}

        {result && (
          <div className="result-block">
            <p className="sql-line"><code>{result.sql}</code></p>
            <ResultTable results={result.results} />
          </div>
        )}
      </main>
    </div>
  );
}