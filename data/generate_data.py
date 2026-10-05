import sqlite3
import random
from datetime import datetime, timedelta
from faker import Faker

fake = Faker()

conn = sqlite3.connect("finance.db")
conn.execute("PRAGMA foreign_keys = ON")
cursor = conn.cursor()

cursor.execute("DROP TABLE IF EXISTS transactions")
cursor.execute("DROP TABLE IF EXISTS customers")

cursor.execute("""
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    city TEXT,
    age INTEGER
)""")

cursor.execute("""
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    merchant TEXT,
    category TEXT,
    amount REAL,
    timestamp TEXT,
    payment_method TEXT,
    city TEXT,
    is_fraud INTEGER,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
)""")

customer_cities = {}

for _ in range(200):
    name = fake.name()
    city = fake.city()
    age = fake.random_int(min=18, max=70)
    cursor.execute(
        "INSERT INTO customers (name, city, age) VALUES (?, ?, ?)",
        (name, city, age)
    )
    customer_cities[cursor.lastrowid] = city

conn.commit()
print("Customers inserted:", cursor.execute("SELECT COUNT(*) FROM customers").fetchone()[0])

categories = {
    "groceries":    (200, 3000),
    "dining":       (150, 2500),
    "electronics":  (2000, 80000),
    "fashion":      (500, 15000),
    "travel":       (1000, 50000),
    "utilities":    (300, 5000),
    "entertainment":(200, 4000),
    "fuel":         (500, 4000),
}
payment_methods = ["credit_card", "debit_card", "upi", "netbanking"]

customer_ids = list(customer_cities.keys())
all_cities = list(set(customer_cities.values()))

now = datetime.now()
six_months_ago = now - timedelta(days=180)

rows = []
fraud_count = 0

for _ in range(10000):
    customer_id = random.choice(customer_ids)
    home_city = customer_cities[customer_id]
    category = random.choice(list(categories.keys()))
    low, high = categories[category]
    amount = round(random.uniform(low, high), 2)
    merchant = fake.company()
    payment_method = random.choice(payment_methods)

    random_seconds = random.randint(0, int((now - six_months_ago).total_seconds()))
    ts = six_months_ago + timedelta(seconds=random_seconds)

    is_fraud = 0
    city = home_city

    if random.random() < 0.02: 
        is_fraud = 1
        fraud_count += 1
        amount = round(amount * random.uniform(5, 10), 2)
        fraud_hour = random.randint(2, 4)
        ts = ts.replace(hour=fraud_hour, minute=random.randint(0, 59))
        other_cities = [c for c in all_cities if c != home_city]
        city = random.choice(other_cities)

    rows.append((
        customer_id, merchant, category, amount,
        ts.strftime("%Y-%m-%d %H:%M:%S"), payment_method, city, is_fraud
    ))

cursor.executemany("""
    INSERT INTO transactions
    (customer_id, merchant, category, amount, timestamp, payment_method, city, is_fraud)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", rows)

conn.commit()

print("Transactions inserted:", cursor.execute("SELECT COUNT(*) FROM transactions").fetchone()[0])
print("Fraud rows:", fraud_count)

conn.close()