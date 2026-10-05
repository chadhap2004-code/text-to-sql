// src/components/HistoryPanel.jsx
import { useEffect, useState } from 'react';
import { getHistory } from '../api';

export default function HistoryPanel({ token, refreshKey }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getHistory(token).then(data => setHistory(data.history)).catch(() => {});
  }, [token, refreshKey]);

  return (
    <div className="history-panel">
      <h3>History</h3>
      {history.length === 0 && <p className="muted">No questions yet.</p>}
      <ul>
        {history.map(item => (
          <li key={item.id}>
            <span className="history-question">{item.question}</span>
            <span className="history-time">{new Date(item.created_at).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}