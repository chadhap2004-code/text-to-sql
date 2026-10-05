# Evaluation Results

| Metric | Naive Prompt | Schema-Aware Prompt |
|---|---|---|
| Accuracy | 11/15 (73.3%) | 12/15 (80.0%) |

## Per-question detail

### Q1: How many customers do we have?
- Gold: `SELECT COUNT(*) as count FROM customers`
- Naive: `SELECT COUNT(*) FROM customers;` — PASS
- Schema-aware: `SELECT COUNT(*) FROM customers` — PASS

### Q2: What is the total amount spent across all transactions?
- Gold: `SELECT SUM(amount) as total FROM transactions`
- Naive: `SELECT SUM(amount) FROM transactions;` — PASS
- Schema-aware: `SELECT SUM(amount) FROM transactions` — PASS

### Q3: What is the average transaction amount?
- Gold: `SELECT AVG(amount) as avg_amount FROM transactions`
- Naive: `SELECT AVG(amount) FROM transactions;` — PASS
- Schema-aware: `SELECT AVG(amount) FROM transactions` — PASS

### Q4: How many transactions are marked as fraud?
- Gold: `SELECT COUNT(*) as count FROM transactions WHERE is_fraud = 1`
- Naive: `SELECT count(*) FROM transactions WHERE is_fraud = 1;` — PASS
- Schema-aware: `SELECT COUNT(*) FROM transactions WHERE is_fraud = 1` — PASS

### Q5: How many transactions used UPI as the payment method?
- Gold: `SELECT COUNT(*) as count FROM transactions WHERE payment_method = 'upi'`
- Naive: `SELECT count(*) FROM transactions WHERE payment_method = 'UPI';` — FAIL
- Schema-aware: `SELECT COUNT(*) FROM transactions WHERE payment_method = 'UPI'` — FAIL

### Q6: What is the total spend in the electronics category?
- Gold: `SELECT SUM(amount) as total FROM transactions WHERE category = 'electronics'`
- Naive: `SELECT SUM(amount) FROM transactions WHERE category = 'electronics';` — PASS
- Schema-aware: `SELECT SUM(amount) FROM transactions WHERE category = 'electronics'` — PASS

### Q7: Top 5 merchants by total spend
- Gold: `SELECT merchant, SUM(amount) as total FROM transactions GROUP BY merchant ORDER BY total DESC LIMIT 5`
- Naive: `SELECT merchant, SUM(amount) AS total_spend
FROM transactions
GROUP BY merchant
ORDER BY total_spend DESC
LIMIT 5;` — PASS
- Schema-aware: `SELECT merchant, SUM(amount) as total FROM transactions GROUP BY merchant ORDER BY total DESC LIMIT 5` — PASS

### Q8: What is the average amount spent per category?
- Gold: `SELECT category, AVG(amount) as avg_amount FROM transactions GROUP BY category`
- Naive: `SELECT category, AVG(amount) FROM transactions GROUP BY category;` — PASS
- Schema-aware: `SELECT category, AVG(amount) FROM transactions GROUP BY category` — PASS

### Q9: How many distinct payment methods are used?
- Gold: `SELECT COUNT(DISTINCT payment_method) as count FROM transactions`
- Naive: `ERROR: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent: [429 Too Many Requests] You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. 
* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 15, model: gemini-3.5-flash-lite
Please retry in 40.528265096s. [{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.5-flash-lite"},"quotaValue":"15"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"40s"}]` — FAIL
- Schema-aware: `ERROR: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent: [429 Too Many Requests] You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. 
* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 15, model: gemini-3.5-flash-lite
Please retry in 37.34366811s. [{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.5-flash-lite"},"quotaValue":"15"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"37s"}]` — FAIL

### Q10: What is the oldest customer's age?
- Gold: `SELECT MAX(age) as max_age FROM customers`
- Naive: `SELECT MAX(age) FROM customers;` — PASS
- Schema-aware: `SELECT MAX(age) FROM customers` — PASS

### Q11: What is the youngest customer's age?
- Gold: `SELECT MIN(age) as min_age FROM customers`
- Naive: `SELECT MIN(age) FROM customers;` — PASS
- Schema-aware: `SELECT MIN(age) FROM customers` — PASS

### Q12: Top 3 customers by total spending, showing their name and city
- Gold: `SELECT c.name, c.city, SUM(t.amount) as total FROM transactions t JOIN customers c ON t.customer_id = c.id GROUP BY c.id ORDER BY total DESC LIMIT 3`
- Naive: `SELECT c.name, c.city FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.name, c.city ORDER BY SUM(o.total_amount) DESC LIMIT 3` — FAIL
- Schema-aware: `SELECT c.name, c.city, SUM(t.amount) AS total FROM customers c JOIN transactions t ON c.id = t.customer_id GROUP BY c.id, c.name, c.city ORDER BY total DESC LIMIT 3` — PASS

### Q13: How many transactions happened for each category?
- Gold: `SELECT category, COUNT(*) as count FROM transactions GROUP BY category`
- Naive: `SELECT category, COUNT(*) FROM transactions GROUP BY category;` — PASS
- Schema-aware: `SELECT category, COUNT(*) FROM transactions GROUP BY category` — PASS

### Q14: Which categories have an average transaction amount greater than 5000?
- Gold: `SELECT category, AVG(amount) as avg_amount FROM transactions GROUP BY category HAVING AVG(amount) > 5000`
- Naive: `SELECT category FROM transactions GROUP BY category HAVING AVG(amount) > 5000` — FAIL
- Schema-aware: `SELECT category FROM transactions GROUP BY category HAVING AVG(amount) > 5000` — FAIL

### Q15: How many transactions does each payment method have, ordered from highest to lowest?
- Gold: `SELECT payment_method, COUNT(*) as count FROM transactions GROUP BY payment_method ORDER BY count DESC`
- Naive: `SELECT payment_method, COUNT(*) AS transaction_count FROM transactions GROUP BY payment_method ORDER BY transaction_count DESC;` — PASS
- Schema-aware: `SELECT payment_method, COUNT(*) AS total FROM transactions GROUP BY payment_method ORDER BY total DESC` — PASS

