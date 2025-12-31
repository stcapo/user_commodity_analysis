"""
Kafka Producer - Simulates E-commerce Transaction Data
Generates realistic transaction data matching the frontend TransactionRow interface
"""

import json
import os
import random
import time
from datetime import datetime, timedelta
from kafka import KafkaProducer

# Configuration from environment
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'ecommerce-transactions')
PRODUCE_RATE = int(os.getenv('PRODUCE_RATE', '5'))  # transactions per second

# Data constants (matching frontend constants)
CATEGORIES = [
    '电子产品', '服装鞋帽', '食品饮料', '家居用品',
    '美妆护肤', '运动户外', '图书音像', '母婴产品'
]
CATEGORY_WEIGHTS = [0.25, 0.22, 0.18, 0.12, 0.10, 0.08, 0.03, 0.02]

PAYMENT_METHODS = ['信用卡', '数字钱包', '现金']
PAYMENT_WEIGHTS = [0.40, 0.35, 0.25]

# Price ranges by category
PRICE_RANGES = {
    '电子产品': (500, 5000),
    '服装鞋帽': (50, 500),
    '食品饮料': (10, 100),
    '家居用品': (50, 1000),
    '美妆护肤': (30, 500),
    '运动户外': (100, 2000),
    '图书音像': (20, 200),
    '母婴产品': (50, 800)
}

# Customer tracking for repeat purchases
customer_counter = 0
existing_customers = []


def weighted_choice(items, weights):
    """Select item based on weights"""
    total = sum(weights)
    r = random.uniform(0, total)
    cumulative = 0
    for item, weight in zip(items, weights):
        cumulative += weight
        if r <= cumulative:
            return item
    return items[-1]


def generate_age():
    """Generate age with 70% concentration in 25-44 range"""
    rand = random.random()
    if rand < 0.7:
        return random.randint(25, 44)
    elif rand < 0.85:
        return random.randint(18, 24)
    elif rand < 0.95:
        return random.randint(45, 54)
    else:
        return random.randint(55, 74)


def generate_quantity():
    """Generate quantity with Poisson-like distribution"""
    rand = random.random()
    if rand < 0.6:
        return 1
    elif rand < 0.85:
        return 2
    elif rand < 0.95:
        return 3
    else:
        return random.randint(4, 6)


def generate_price(category):
    """Generate price based on category"""
    min_price, max_price = PRICE_RANGES.get(category, (50, 500))
    return round(random.uniform(min_price, max_price), 2)


def get_customer_id():
    """Generate or reuse customer ID with 35% repeat rate"""
    global customer_counter, existing_customers
    
    if existing_customers and random.random() < 0.35:
        return random.choice(existing_customers)
    else:
        customer_counter += 1
        new_id = f"CUST_{customer_counter:06d}"
        existing_customers.append(new_id)
        # Limit memory usage
        if len(existing_customers) > 10000:
            existing_customers = existing_customers[-5000:]
        return new_id


def generate_transaction():
    """Generate a single transaction record"""
    now = datetime.now()
    
    category = weighted_choice(CATEGORIES, CATEGORY_WEIGHTS)
    payment_method = weighted_choice(PAYMENT_METHODS, PAYMENT_WEIGHTS)
    
    transaction = {
        'customer_id': get_customer_id(),
        'gender': random.choice(['Male', 'Female']),
        'age': generate_age(),
        'category': category,
        'quantity': generate_quantity(),
        'price': generate_price(category),
        'payment_method': payment_method,
        'invoice_date': now.strftime('%Y-%m-%d'),
        'invoice_time': now.strftime('%H:%M:%S'),
        'timestamp': now.isoformat()
    }
    
    return transaction


def create_producer():
    """Create Kafka producer with retry logic"""
    max_retries = 30
    retry_interval = 2
    
    for attempt in range(max_retries):
        try:
            producer = KafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v, ensure_ascii=False).encode('utf-8'),
                acks='all',
                retries=3
            )
            print(f"[Producer] Connected to Kafka at {KAFKA_BOOTSTRAP_SERVERS}")
            return producer
        except Exception as e:
            print(f"[Producer] Connection attempt {attempt + 1}/{max_retries} failed: {e}")
            time.sleep(retry_interval)
    
    raise Exception("Failed to connect to Kafka after maximum retries")


def main():
    print(f"[Producer] Starting with rate: {PRODUCE_RATE} transactions/second")
    print(f"[Producer] Topic: {KAFKA_TOPIC}")
    
    producer = create_producer()
    
    interval = 1.0 / PRODUCE_RATE
    transaction_count = 0
    
    try:
        while True:
            transaction = generate_transaction()
            
            producer.send(KAFKA_TOPIC, value=transaction)
            transaction_count += 1
            
            if transaction_count % 100 == 0:
                print(f"[Producer] Sent {transaction_count} transactions | "
                      f"Latest: {transaction['customer_id']} - {transaction['category']} - ¥{transaction['price']}")
            
            time.sleep(interval)
            
    except KeyboardInterrupt:
        print(f"\n[Producer] Shutting down. Total sent: {transaction_count}")
    finally:
        producer.close()


if __name__ == '__main__':
    main()
