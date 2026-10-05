import sqlite3

conn = sqlite3.connect("finance.db")
cursor = conn.cursor()

# 1. Number of customers
cursor.execute("SELECT COUNT(*) FROM customers")
print("Customers:", cursor.fetchone()[0])

# 2. Transactions + fraud rate
cursor.execute("""
SELECT
    SUM(is_fraud),
    COUNT(*),
    100.0 * SUM(is_fraud) / COUNT(*)
FROM transactions
""")

fraud_count, total_transactions, fraud_rate = cursor.fetchone()

print("Transactions:", total_transactions)
print("Fraud count:", fraud_count)
print("Fraud rate:", fraud_rate, "%")

# 3. Top 5 customers by spending
cursor.execute("""
SELECT
    c.id,
    c.name,
    SUM(t.amount) AS total_spend
FROM customers c
JOIN transactions t
    ON c.id = t.customer_id
GROUP BY c.id, c.name
ORDER BY total_spend DESC
LIMIT 5
""")

print("\nTop 5 customers:")
for row in cursor.fetchall():
    print(row)

# 4. Average transaction amount
cursor.execute("""
SELECT
    is_fraud,
    AVG(amount)
FROM transactions
GROUP BY is_fraud
""")

print("\nAverage amount:")
for row in cursor.fetchall():
    print(row)

conn.close()