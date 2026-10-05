# Fintech Text-to-SQL Analyst

A full-stack application that lets users ask questions about financial transaction data in plain English. An LLM (Google Gemini) converts the question into SQL, which is validated and executed safely against a read-only database.

## Features

- **Natural language to SQL** — ask questions like "top 5 merchants by total spend" and get real results
- **Authentication** — JWT-based auth with bcrypt password hashing and email OTP verification
- **Per-user query history**
- **Defense-in-depth security** — a read-only database connection, a SQL validator, and the LLM's own prompt constraints all work together
- **Evaluated prompting strategies** — naive vs. schema-aware prompting, measured on 15 test questions

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| LLM | Google Gemini API |
| Auth | JWT, bcrypt, email OTP via Nodemailer |
| Data generation | Python, Faker |

## Architecture

The backend uses **two separate SQLite databases**:

```
finance.db   — read-only connection, holds customers + transactions.
               This is the ONLY database the LLM-generated SQL can touch.

app.db       — read-write connection, holds users + query history.
               Completely isolated from finance.db, so a crafted
               question can never reach user credentials.
```

Every `/ask` request goes through three layers before touching the database:
1. The LLM is prompted with rules restricting it to `SELECT` statements only.
2. A SQL validator rejects anything that isn't a `SELECT`, or that references a table outside an allowlist.
3. The database connection itself is opened in read-only mode, as a last line of defense.

## Setup

### Prerequisites
- Node.js
- Python 3.x
- A [Gemini API key](https://ai.google.dev/)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) (for sending OTP emails)

### 1. Generate the data
```bash
cd data
python generate_data.py
```

### 2. Backend
```bash
cd backend
npm install
```
Create `backend/.env`:
```
JWT_SECRET=<any random string>
GEMINI_API_KEY=<your Gemini API key>
GEMINI_MODEL=gemini-3.5-flash-lite
EMAIL_USER=<your gmail address>
EMAIL_APP_PASSWORD=<your 16-character app password>
```
```bash
node server.js
```
Server runs on `http://localhost:3000`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs on `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| POST | `/auth/register` | Create an account, sends an OTP email | No |
| POST | `/auth/verify-email` | Verify OTP, returns a JWT | No |
| POST | `/auth/resend-otp` | Resend the OTP | No |
| POST | `/auth/login` | Login, returns a JWT | No |
| POST | `/ask` | Ask a question in natural language | Yes |
| GET | `/history` | Get the current user's past questions | Yes |

## Evaluation

Measured on 15 hand-written test questions (count, sum, average, group by, having, joins, distinct), comparing a naive prompt (question only) against a schema-aware prompt (schema + rules + few-shot examples), using execution accuracy (does the generated SQL return the same result as a hand-written "gold" query).

| Metric | Naive Prompt | Schema-Aware Prompt |
|---|---|---|
| Accuracy | 11/15 (73.3%) | 12/15 (80.0%) |

**Key findings:**
- On a JOIN question, the naive prompt hallucinated a non-existent `orders` table, while the schema-aware prompt correctly used the actual `transactions` table — direct evidence that grounding the LLM in the real schema matters.
- A case-sensitivity mismatch (data stored as `'upi'`, the LLM generated `'UPI'`) failed both prompts, suggesting that including example data values, not just column names, would improve accuracy further.
- One evaluation run exposed a limitation in the evaluation method itself: a semantically reasonable answer was marked wrong because it didn't replicate every column of the hand-written gold query.

## Known Limitations

- Free-tier LLM rate limits can cause delays or failures under heavy use.
- String matching in generated SQL is case-sensitive; the LLM isn't always aware of the exact casing used in the underlying data.
- No pagination on `/history` or large result sets yet.

## Roadmap

**Phase 2 (in progress):** a RAG-based policy/document assistant, with the LLM routing between SQL queries (for structured data) and document retrieval (for policy/FAQ-style questions) using tool calling.

## Project Structure
```
text-to-sql/
├── data/              # Synthetic data generation (Python)
├── backend/           # Node.js + Express API
│   ├── config/        # Database connections
│   ├── routes/        # auth, ask, history
│   ├── middleware/     # JWT auth
│   ├── services/      # LLM calls, SQL validation, email
│   └── eval/          # Evaluation questions + script
└── frontend/          # React (Vite) UI
```