"""
Spark Consumer - Real-time Data Processing & ML Analysis
Consumes transactions from Kafka, runs ML models, stores results in MySQL and Redis
"""

import json
import os
import time
from datetime import datetime
from collections import defaultdict

import mysql.connector
import redis
from kafka import KafkaConsumer
import numpy as np

# Configuration from environment
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'ecommerce-transactions')
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', '3306'))
MYSQL_USER = os.getenv('MYSQL_USER', 'ecommerce_user')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'ecommerce_pass')
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'ecommerce')
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))

# Batch settings
BATCH_SIZE = 50
BATCH_TIMEOUT = 10  # seconds

# In-memory aggregators
transaction_batch = []
daily_metrics = defaultdict(lambda: {'gmv': 0, 'orders': 0, 'buyers': set(), 'items': 0})
category_metrics = defaultdict(lambda: defaultdict(lambda: {'gmv': 0, 'orders': 0, 'buyers': set()}))
customer_data = defaultdict(lambda: {'orders': 0, 'gmv': 0, 'last_date': None})


def create_mysql_connection():
    """Create MySQL connection with retry"""
    max_retries = 30
    for attempt in range(max_retries):
        try:
            conn = mysql.connector.connect(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                database=MYSQL_DATABASE
            )
            print(f"[Consumer] Connected to MySQL at {MYSQL_HOST}:{MYSQL_PORT}")
            return conn
        except Exception as e:
            print(f"[Consumer] MySQL connection attempt {attempt + 1}/{max_retries}: {e}")
            time.sleep(2)
    raise Exception("Failed to connect to MySQL")


def create_redis_connection():
    """Create Redis connection with retry"""
    max_retries = 30
    for attempt in range(max_retries):
        try:
            r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
            r.ping()
            print(f"[Consumer] Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
            return r
        except Exception as e:
            print(f"[Consumer] Redis connection attempt {attempt + 1}/{max_retries}: {e}")
            time.sleep(2)
    raise Exception("Failed to connect to Redis")


def create_kafka_consumer():
    """Create Kafka consumer with retry"""
    max_retries = 30
    for attempt in range(max_retries):
        try:
            consumer = KafkaConsumer(
                KAFKA_TOPIC,
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='latest',
                enable_auto_commit=True,
                group_id='ecommerce-consumer-group'
            )
            print(f"[Consumer] Connected to Kafka, subscribed to {KAFKA_TOPIC}")
            return consumer
        except Exception as e:
            print(f"[Consumer] Kafka connection attempt {attempt + 1}/{max_retries}: {e}")
            time.sleep(2)
    raise Exception("Failed to connect to Kafka")


def segment_customer(orders, gmv):
    """Simple RFM-based customer segmentation"""
    if orders >= 5 and gmv >= 1000:
        return 'VIP'
    elif orders >= 3 or gmv >= 500:
        return 'Loyal'
    elif orders >= 2:
        return 'Regular'
    else:
        return 'New'


def predict_churn_risk(orders, days_since_last):
    """Simple churn risk prediction (0-1)"""
    if orders == 0:
        return 1.0
    base_risk = max(0, min(1, (days_since_last - 30) / 90))
    loyalty_factor = min(1, orders / 10)
    return round(base_risk * (1 - loyalty_factor * 0.5), 4)


def process_transaction(transaction):
    """Process a single transaction and update aggregators"""
    global daily_metrics, category_metrics, customer_data
    
    date = transaction['invoice_date']
    category = transaction['category']
    customer_id = transaction['customer_id']
    gmv = transaction['price'] * transaction['quantity']
    
    # Update daily metrics
    daily_metrics[date]['gmv'] += gmv
    daily_metrics[date]['orders'] += 1
    daily_metrics[date]['buyers'].add(customer_id)
    daily_metrics[date]['items'] += transaction['quantity']
    
    # Update category metrics
    category_metrics[date][category]['gmv'] += gmv
    category_metrics[date][category]['orders'] += 1
    category_metrics[date][category]['buyers'].add(customer_id)
    
    # Update customer data
    customer_data[customer_id]['orders'] += 1
    customer_data[customer_id]['gmv'] += gmv
    customer_data[customer_id]['last_date'] = date
    customer_data[customer_id]['gender'] = transaction['gender']
    customer_data[customer_id]['age'] = transaction['age']


def save_to_mysql(mysql_conn, transactions):
    """Save batch of transactions to MySQL"""
    cursor = mysql_conn.cursor()
    
    try:
        # Insert transactions
        insert_sql = """
            INSERT INTO transactions 
            (customer_id, gender, age, category, quantity, price, payment_method, invoice_date, invoice_time)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        values = [
            (
                t['customer_id'], t['gender'], t['age'], t['category'],
                t['quantity'], t['price'], t['payment_method'],
                t['invoice_date'], t.get('invoice_time')
            )
            for t in transactions
        ]
        
        cursor.executemany(insert_sql, values)
        
        # Update daily metrics
        for date, metrics in daily_metrics.items():
            cursor.execute("""
                INSERT INTO daily_metrics (metric_date, gmv, order_count, unique_buyers, items_sold, aov)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    gmv = gmv + VALUES(gmv),
                    order_count = order_count + VALUES(order_count),
                    unique_buyers = VALUES(unique_buyers),
                    items_sold = items_sold + VALUES(items_sold),
                    aov = (gmv + VALUES(gmv)) / (order_count + VALUES(order_count))
            """, (
                date, 
                metrics['gmv'], 
                metrics['orders'], 
                len(metrics['buyers']),
                metrics['items'],
                metrics['gmv'] / max(1, metrics['orders'])
            ))
        
        # Update category metrics
        for date, categories in category_metrics.items():
            for category, metrics in categories.items():
                cursor.execute("""
                    INSERT INTO category_metrics (metric_date, category, gmv, order_count, unique_buyers)
                    VALUES (%s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE 
                        gmv = gmv + VALUES(gmv),
                        order_count = order_count + VALUES(order_count),
                        unique_buyers = VALUES(unique_buyers)
                """, (date, category, metrics['gmv'], metrics['orders'], len(metrics['buyers'])))
        
        # Update user segments with ML predictions
        for customer_id, data in customer_data.items():
            segment = segment_customer(data['orders'], data['gmv'])
            days_since = 0  # Simplified for real-time
            churn_risk = predict_churn_risk(data['orders'], days_since)
            
            cursor.execute("""
                INSERT INTO user_segments 
                (customer_id, segment, total_orders, total_gmv, last_order_date, predicted_churn_risk)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    segment = VALUES(segment),
                    total_orders = VALUES(total_orders),
                    total_gmv = VALUES(total_gmv),
                    last_order_date = VALUES(last_order_date),
                    predicted_churn_risk = VALUES(predicted_churn_risk)
            """, (customer_id, segment, data['orders'], data['gmv'], data['last_date'], churn_risk))
        
        mysql_conn.commit()
        print(f"[Consumer] Saved {len(transactions)} transactions to MySQL")
        
    except Exception as e:
        print(f"[Consumer] MySQL save error: {e}")
        mysql_conn.rollback()
    finally:
        cursor.close()


def update_redis_cache(redis_conn, transactions):
    """Update Redis with real-time metrics"""
    try:
        # Calculate batch totals
        batch_gmv = sum(t['price'] * t['quantity'] for t in transactions)
        batch_orders = len(transactions)
        batch_buyers = len(set(t['customer_id'] for t in transactions))
        
        # Update counters
        redis_conn.incrbyfloat('realtime:total_gmv', batch_gmv)
        redis_conn.incrby('realtime:total_orders', batch_orders)
        
        # Store latest transactions for real-time display
        for t in transactions[-10:]:
            redis_conn.lpush('realtime:latest_transactions', json.dumps(t, ensure_ascii=False))
        redis_conn.ltrim('realtime:latest_transactions', 0, 99)
        
        # Category breakdown (last hour approximation)
        for t in transactions:
            category_gmv = t['price'] * t['quantity']
            redis_conn.incrbyfloat(f"realtime:category:{t['category']}", category_gmv)
        
        # Set TTL for category keys (1 hour)
        for category in set(t['category'] for t in transactions):
            redis_conn.expire(f"realtime:category:{category}", 3600)
        
        # Update timestamp
        redis_conn.set('realtime:last_updated', datetime.now().isoformat())
        
        print(f"[Consumer] Updated Redis cache with {batch_orders} orders, GMV: ¥{batch_gmv:.2f}")
        
    except Exception as e:
        print(f"[Consumer] Redis update error: {e}")


def clear_batch_aggregators():
    """Clear batch aggregators after processing"""
    global daily_metrics, category_metrics
    daily_metrics.clear()
    category_metrics.clear()


def main():
    print("[Consumer] Starting Spark Consumer...")
    
    # Connect to services
    mysql_conn = create_mysql_connection()
    redis_conn = create_redis_connection()
    consumer = create_kafka_consumer()
    
    batch_start_time = time.time()
    processed_count = 0
    
    try:
        print("[Consumer] Waiting for messages...")
        
        for message in consumer:
            transaction = message.value
            transaction_batch.append(transaction)
            process_transaction(transaction)
            
            # Check if batch should be processed
            batch_elapsed = time.time() - batch_start_time
            
            if len(transaction_batch) >= BATCH_SIZE or batch_elapsed >= BATCH_TIMEOUT:
                if transaction_batch:
                    save_to_mysql(mysql_conn, transaction_batch)
                    update_redis_cache(redis_conn, transaction_batch)
                    
                    processed_count += len(transaction_batch)
                    print(f"[Consumer] Total processed: {processed_count}")
                    
                    transaction_batch.clear()
                    clear_batch_aggregators()
                    batch_start_time = time.time()
                    
    except KeyboardInterrupt:
        print(f"\n[Consumer] Shutting down. Total processed: {processed_count}")
    finally:
        # Process remaining batch
        if transaction_batch:
            save_to_mysql(mysql_conn, transaction_batch)
            update_redis_cache(redis_conn, transaction_batch)
        
        mysql_conn.close()
        redis_conn.close()
        consumer.close()


if __name__ == '__main__':
    main()
