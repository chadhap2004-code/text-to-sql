export default function ResultTable({ results }) {
  if (!results || results.length === 0) {
    return <p className="muted">No results.</p>;
  }

  const columns = Object.keys(results[0]);

  return (
    <table className="result-table">
      <thead>
        <tr>
          {columns.map(col => <th key={col}>{col}</th>)}
        </tr>
      </thead>
      <tbody>
        {results.map((row, i) => (
          <tr key={i}>
            {columns.map(col => <td key={col}>{String(row[col])}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}