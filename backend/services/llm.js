// services/llm.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });

const SCHEMA = `
Tables:
customers(id INTEGER, name TEXT, city TEXT, age INTEGER)
transactions(id INTEGER, customer_id INTEGER, merchant TEXT, category TEXT,
             amount REAL, timestamp TEXT, payment_method TEXT, city TEXT, is_fraud INTEGER)
transactions.customer_id references customers.id
`;

// retries a function on transient (503) errors, with exponential backoff
async function callWithRetry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const is503 = err.message?.includes('503') || err.message?.includes('overloaded');
      const isLastAttempt = i === retries - 1;

      if (is503 && !isLastAttempt) {
        console.log(`Gemini overloaded, retrying in ${delay * (i + 1)}ms... (attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw err; // not a 503, or out of retries — let it fail
    }
  }
}

// naive: just the question, no schema
async function generateSqlNaive(question) {
  const prompt = `Write a SQLite query for: "${question}". Return ONLY the SQL, no explanation, no markdown.`;
  const result = await callWithRetry(() => model.generateContent(prompt));
  return cleanSql(result.response.text());
}

// schema-aware: schema + rules + few-shot examples
async function generateSqlSchemaAware(question) {
  const prompt = `
You are a SQLite expert. Given this schema:
${SCHEMA}

Rules:
- Only SELECT statements.
- Use table aliases for joins.
- Return ONLY the raw SQL query. No markdown, no explanation, no semicolon at the end.

Examples:
Q: "How many customers do we have?"
A: SELECT COUNT(*) FROM customers

Q: "Top 5 merchants by total spend"
A: SELECT merchant, SUM(amount) as total FROM transactions GROUP BY merchant ORDER BY total DESC LIMIT 5

Q: "${question}"
A:`;

  const result = await callWithRetry(() => model.generateContent(prompt));
  return cleanSql(result.response.text());
}

function cleanSql(text) {
  return text.replace(/```sql|```/g, '').trim();
}

module.exports = { generateSqlNaive, generateSqlSchemaAware };