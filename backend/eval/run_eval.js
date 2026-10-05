// backend/eval/run_eval.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { financeDb } = require('../config/db');
const { generateSqlNaive, generateSqlSchemaAware } = require('../services/llm');
const { validateSql } = require('../services/sqlValidator');

const questions = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf-8')
);

function runSql(sql) {
  try {
    return financeDb.prepare(sql).all();
  } catch (err) {
    return { error: err.message };
  }
}

// compares two result sets by VALUES, ignoring column names/order between rows
// (so "SELECT COUNT(*)" and "SELECT COUNT(*) as count" still match)
function resultsMatch(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const normalize = (rows) => rows.map(r => JSON.stringify(Object.values(r))).sort();
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function evaluate() {
  let naiveCorrect = 0;
  let schemaCorrect = 0;
  const details = [];

  for (const q of questions) {
    const gold = runSql(q.gold_sql);

    // naive
    let naiveSql = 'ERROR', naiveOk = false;
    try {
      naiveSql = await generateSqlNaive(q.question);
      const { valid } = validateSql(naiveSql);
      const naiveResult = valid ? runSql(naiveSql) : { error: 'blocked by validator' };
      naiveOk = valid && resultsMatch(gold, naiveResult);
    } catch (err) {
      naiveSql = `ERROR: ${err.message}`;
    }

    await sleep(2500); // ~24 req/min, safe under gemini-3.5-flash-lite's 30 RPM free-tier limit

    // schema-aware
    let schemaSql = 'ERROR', schemaOk = false;
    try {
      schemaSql = await generateSqlSchemaAware(q.question);
      const { valid } = validateSql(schemaSql);
      const schemaResult = valid ? runSql(schemaSql) : { error: 'blocked by validator' };
      schemaOk = valid && resultsMatch(gold, schemaResult);
    } catch (err) {
      schemaSql = `ERROR: ${err.message}`;
    }

    if (naiveOk) naiveCorrect++;
    if (schemaOk) schemaCorrect++;

    details.push({ id: q.id, question: q.question, gold_sql: q.gold_sql, naiveSql, naiveOk, schemaSql, schemaOk });
    console.log(`Q${q.id}: naive=${naiveOk ? 'PASS' : 'FAIL'}  schema-aware=${schemaOk ? 'PASS' : 'FAIL'}`);

    await sleep(2500);
  }

  const total = questions.length;
  const naivePct = ((naiveCorrect / total) * 100).toFixed(1);
  const schemaPct = ((schemaCorrect / total) * 100).toFixed(1);

  console.log(`\nNaive accuracy: ${naiveCorrect}/${total} (${naivePct}%)`);
  console.log(`Schema-aware accuracy: ${schemaCorrect}/${total} (${schemaPct}%)`);

  let md = `# Evaluation Results\n\n`;
  md += `| Metric | Naive Prompt | Schema-Aware Prompt |\n|---|---|---|\n`;
  md += `| Accuracy | ${naiveCorrect}/${total} (${naivePct}%) | ${schemaCorrect}/${total} (${schemaPct}%) |\n\n`;
  md += `## Per-question detail\n\n`;
  for (const d of details) {
    md += `### Q${d.id}: ${d.question}\n`;
    md += `- Gold: \`${d.gold_sql}\`\n`;
    md += `- Naive: \`${d.naiveSql}\` — ${d.naiveOk ? 'PASS' : 'FAIL'}\n`;
    md += `- Schema-aware: \`${d.schemaSql}\` — ${d.schemaOk ? 'PASS' : 'FAIL'}\n\n`;
  }
  fs.writeFileSync(path.join(__dirname, 'results.md'), md);
  console.log('\nWritten to eval/results.md');
}

evaluate();