// services/sqlValidator.js
const ALLOWED_TABLES = ['customers', 'transactions'];
const FORBIDDEN_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER',
  'CREATE', 'TRUNCATE', 'ATTACH', 'PRAGMA', 'REPLACE'
];

function validateSql(sql) {
  const upperSql = sql.toUpperCase();

  if (!upperSql.trim().startsWith('SELECT')) {
    return { valid: false, error: 'Only SELECT queries are allowed' };
  }

  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (upperSql.includes(keyword)) {
      return { valid: false, error: `Forbidden keyword: ${keyword}` };
    }
  }

  const usesAllowedTable = ALLOWED_TABLES.some(table =>
    upperSql.includes(table.toUpperCase())
  );
  if (!usesAllowedTable) {
    return { valid: false, error: 'Query does not reference an allowed table' };
  }

  return { valid: true };
}

module.exports = { validateSql };