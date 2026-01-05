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
import pandas as pd

# PySpark imports
try:
    from pyspark.sql import SparkSession
    from pyspark.sql.functions import col, sum as spark_sum, count, avg, max as spark_max, min as spark_min
    from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType, DateType
    PYSPARK_AVAILABLE = True
except ImportError:
    PYSPARK_AVAILABLE = False
    print("[Consumer] Warning: PySpark not installed. Spark processing disabled.")

# Machine Learning imports
try:
    from sklearn.preprocessing import StandardScaler, LabelEncoder
    from sklearn.cluster import KMeans
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import silhouette_score, roc_auc_score
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("[Consumer] Warning: scikit-learn not installed. ML models disabled.")

try:
    import happybase
    HBASE_AVAILABLE = True
except ImportError:
    HBASE_AVAILABLE = False
    print("[Consumer] Warning: happybase not installed. HBase support disabled.")

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
HBASE_HOST = os.getenv('HBASE_HOST', 'localhost')
HBASE_PORT = int(os.getenv('HBASE_PORT', '9090'))

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


def create_hbase_connection():
    """Create HBase connection with retry"""
    if not HBASE_AVAILABLE:
        print("[Consumer] HBase support disabled (happybase not installed)")
        return None

    max_retries = 30
    for attempt in range(max_retries):
        try:
            conn = happybase.Connection(HBASE_HOST, HBASE_PORT)
            print(f"[Consumer] Connected to HBase at {HBASE_HOST}:{HBASE_PORT}")
            return conn
        except Exception as e:
            print(f"[Consumer] HBase connection attempt {attempt + 1}/{max_retries}: {e}")
            time.sleep(2)
    print("[Consumer] Warning: Failed to connect to HBase. Continuing without HBase support.")
    return None


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


def save_to_hbase(hbase_conn, transactions):
    """Save batch of transactions to HBase"""
    if hbase_conn is None:
        return

    try:
        table = hbase_conn.table('transactions')

        for t in transactions:
            # Row Key: invoice_date#customer_id#timestamp
            row_key = f"{t['invoice_date']}#{t['customer_id']}#{int(time.time()*1000)}"

            data = {
                b'cf:customer_id': t['customer_id'].encode('utf-8'),
                b'cf:gender': t['gender'].encode('utf-8'),
                b'cf:age': str(t['age']).encode('utf-8'),
                b'cf:category': t['category'].encode('utf-8'),
                b'cf:quantity': str(t['quantity']).encode('utf-8'),
                b'cf:price': str(t['price']).encode('utf-8'),
                b'cf:payment_method': t['payment_method'].encode('utf-8'),
                b'cf:invoice_time': t.get('invoice_time', '').encode('utf-8'),
            }

            table.put(row_key.encode('utf-8'), data)

        print(f"[Consumer] Saved {len(transactions)} transactions to HBase")

    except Exception as e:
        print(f"[Consumer] HBase save error: {e}")


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


# ============================================
# PySpark Processing Functions
# ============================================

def create_spark_session():
    """Create and return a Spark session for distributed processing"""
    if not PYSPARK_AVAILABLE:
        print("[Consumer] PySpark not available, skipping Spark session creation")
        return None

    try:
        spark = SparkSession.builder \
            .appName("EcommerceAnalytics") \
            .master("local[*]") \
            .config("spark.sql.shuffle.partitions", "4") \
            .config("spark.driver.memory", "2g") \
            .config("spark.executor.memory", "2g") \
            .getOrCreate()

        print("[Consumer] Spark session created successfully")
        return spark
    except Exception as e:
        print(f"[Consumer] Failed to create Spark session: {e}")
        return None


def process_with_spark(spark, transactions_data):
    """Process transactions using PySpark for distributed computing"""
    if spark is None or not PYSPARK_AVAILABLE:
        return None

    try:
        # Define schema for transactions
        schema = StructType([
            StructField("customer_id", StringType(), True),
            StructField("gender", StringType(), True),
            StructField("age", IntegerType(), True),
            StructField("category", StringType(), True),
            StructField("quantity", IntegerType(), True),
            StructField("price", DoubleType(), True),
            StructField("payment_method", StringType(), True),
            StructField("invoice_date", StringType(), True),
        ])

        # Create DataFrame from transactions
        df = spark.createDataFrame(transactions_data, schema=schema)

        # Calculate aggregations using Spark
        agg_result = df.groupBy("category").agg(
            spark_sum("price").alias("total_gmv"),
            count("*").alias("order_count"),
            avg("price").alias("avg_price"),
            spark_max("price").alias("max_price"),
            spark_min("price").alias("min_price")
        )

        print(f"[Consumer] Spark processing completed for {len(transactions_data)} transactions")
        return agg_result

    except Exception as e:
        print(f"[Consumer] Spark processing error: {e}")
        return None


def spark_customer_analytics(spark, transactions_data):
    """Perform customer analytics using Spark SQL"""
    if spark is None or not PYSPARK_AVAILABLE:
        return None

    try:
        schema = StructType([
            StructField("customer_id", StringType(), True),
            StructField("gender", StringType(), True),
            StructField("age", IntegerType(), True),
            StructField("category", StringType(), True),
            StructField("quantity", IntegerType(), True),
            StructField("price", DoubleType(), True),
            StructField("payment_method", StringType(), True),
            StructField("invoice_date", StringType(), True),
        ])

        df = spark.createDataFrame(transactions_data, schema=schema)
        df.createOrReplaceTempView("transactions")

        # Customer lifetime value analysis
        customer_ltv = spark.sql("""
            SELECT
                customer_id,
                COUNT(*) as total_orders,
                SUM(price * quantity) as lifetime_value,
                AVG(price * quantity) as avg_order_value,
                COUNT(DISTINCT category) as category_diversity
            FROM transactions
            GROUP BY customer_id
            ORDER BY lifetime_value DESC
        """)

        print("[Consumer] Spark customer analytics completed")
        return customer_ltv

    except Exception as e:
        print(f"[Consumer] Spark customer analytics error: {e}")
        return None


# ============================================
# Machine Learning Functions
# ============================================

def train_customer_segmentation_model(transactions_data):
    """Train KMeans clustering model for customer segmentation"""
    if not ML_AVAILABLE:
        print("[Consumer] scikit-learn not available, skipping ML model training")
        return None

    try:
        # Prepare data for clustering
        df = pd.DataFrame(transactions_data)

        # Aggregate by customer
        customer_features = df.groupby('customer_id').agg({
            'price': ['sum', 'mean', 'count'],
            'quantity': 'sum',
            'age': 'first',
            'gender': 'first'
        }).reset_index()

        customer_features.columns = ['customer_id', 'total_gmv', 'avg_price', 'order_count',
                                     'total_quantity', 'age', 'gender']

        # Encode categorical features
        le = LabelEncoder()
        customer_features['gender_encoded'] = le.fit_transform(customer_features['gender'])

        # Select features for clustering
        features = customer_features[['total_gmv', 'avg_price', 'order_count', 'age', 'gender_encoded']]

        # Standardize features
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)

        # Train KMeans model
        kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
        customer_features['segment'] = kmeans.fit_predict(features_scaled)

        # Calculate silhouette score
        silhouette_avg = silhouette_score(features_scaled, customer_features['segment'])

        print(f"[Consumer] Customer segmentation model trained. Silhouette score: {silhouette_avg:.4f}")
        return kmeans, scaler, customer_features

    except Exception as e:
        print(f"[Consumer] Customer segmentation model training error: {e}")
        return None


def train_churn_prediction_model(transactions_data):
    """Train classification model for customer churn prediction"""
    if not ML_AVAILABLE:
        print("[Consumer] scikit-learn not available, skipping churn prediction model")
        return None

    try:
        df = pd.DataFrame(transactions_data)

        # Aggregate customer features
        customer_data = df.groupby('customer_id').agg({
            'price': ['sum', 'mean', 'count'],
            'quantity': 'sum',
            'age': 'first',
            'gender': 'first',
            'invoice_date': ['min', 'max']
        }).reset_index()

        customer_data.columns = ['customer_id', 'total_gmv', 'avg_price', 'order_count',
                                 'total_quantity', 'age', 'gender', 'first_date', 'last_date']

        # Create churn label (simplified: customers with only 1 order are at risk)
        customer_data['churn_risk'] = (customer_data['order_count'] == 1).astype(int)

        # Encode categorical features
        le = LabelEncoder()
        customer_data['gender_encoded'] = le.fit_transform(customer_data['gender'])

        # Select features
        features = customer_data[['total_gmv', 'avg_price', 'order_count', 'age', 'gender_encoded']]
        target = customer_data['churn_risk']

        # Standardize features
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)

        # Train multiple models
        models = {
            'logistic_regression': LogisticRegression(random_state=42, max_iter=1000),
            'random_forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'gradient_boosting': GradientBoostingClassifier(n_estimators=100, random_state=42)
        }

        best_model = None
        best_score = 0

        for model_name, model in models.items():
            model.fit(features_scaled, target)
            score = model.score(features_scaled, target)
            print(f"[Consumer] {model_name} accuracy: {score:.4f}")

            if score > best_score:
                best_score = score
                best_model = model

        print(f"[Consumer] Churn prediction model trained. Best model accuracy: {best_score:.4f}")
        return best_model, scaler, customer_data

    except Exception as e:
        print(f"[Consumer] Churn prediction model training error: {e}")
        return None


def predict_customer_ltv(model, scaler, customer_features):
    """Predict customer lifetime value using trained model"""
    if model is None or scaler is None:
        return None

    try:
        # Prepare features
        features = customer_features[['total_gmv', 'avg_price', 'order_count', 'age', 'gender_encoded']]
        features_scaled = scaler.transform(features)

        # Make predictions
        predictions = model.predict(features_scaled)

        print(f"[Consumer] LTV predictions generated for {len(predictions)} customers")
        return predictions

    except Exception as e:
        print(f"[Consumer] LTV prediction error: {e}")
        return None


def analyze_product_affinity(transactions_data):
    """Analyze product affinity and cross-sell opportunities using ML"""
    if not ML_AVAILABLE:
        return None

    try:
        df = pd.DataFrame(transactions_data)

        # Create customer-category matrix
        customer_category = df.groupby(['customer_id', 'category']).agg({
            'price': 'sum',
            'quantity': 'sum'
        }).reset_index()

        # Pivot to create feature matrix
        pivot_matrix = customer_category.pivot_table(
            index='customer_id',
            columns='category',
            values='price',
            fill_value=0
        )

        # Standardize
        scaler = StandardScaler()
        matrix_scaled = scaler.fit_transform(pivot_matrix)

        # Perform clustering to find similar customers
        kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(matrix_scaled)

        print(f"[Consumer] Product affinity analysis completed. Found {len(np.unique(clusters))} customer clusters")
        return pivot_matrix, clusters

    except Exception as e:
        print(f"[Consumer] Product affinity analysis error: {e}")
        return None


def train_demand_forecasting_model(transactions_data):
    """Train time series forecasting model for demand prediction"""
    if not ML_AVAILABLE:
        return None

    try:
        df = pd.DataFrame(transactions_data)

        # Aggregate by date and category
        daily_category = df.groupby(['invoice_date', 'category']).agg({
            'price': 'sum',
            'quantity': 'sum'
        }).reset_index()

        # For each category, train a simple model
        models = {}

        for category in daily_category['category'].unique():
            category_data = daily_category[daily_category['category'] == category].sort_values('invoice_date')

            if len(category_data) < 5:
                continue

            # Create features (lag features)
            category_data['gmv'] = category_data['price']
            category_data['gmv_lag1'] = category_data['gmv'].shift(1)
            category_data['gmv_lag2'] = category_data['gmv'].shift(2)
            category_data['quantity_lag1'] = category_data['quantity'].shift(1)

            # Remove NaN rows
            category_data = category_data.dropna()

            if len(category_data) < 3:
                continue

            # Train model
            X = category_data[['gmv_lag1', 'gmv_lag2', 'quantity_lag1']]
            y = category_data['gmv']

            model = RandomForestClassifier(n_estimators=50, random_state=42)
            # Note: Using classifier for demonstration, in production use regression
            model.fit(X.astype(int), (y > y.median()).astype(int))

            models[category] = model

        print(f"[Consumer] Demand forecasting models trained for {len(models)} categories")
        return models

    except Exception as e:
        print(f"[Consumer] Demand forecasting model training error: {e}")
        return None


def main():
    print("[Consumer] Starting Spark Consumer...")

    # Connect to services
    mysql_conn = create_mysql_connection()
    redis_conn = create_redis_connection()
    hbase_conn = create_hbase_connection()
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
                    save_to_hbase(hbase_conn, transaction_batch)
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
            save_to_hbase(hbase_conn, transaction_batch)
            save_to_mysql(mysql_conn, transaction_batch)
            update_redis_cache(redis_conn, transaction_batch)

        mysql_conn.close()
        redis_conn.close()
        if hbase_conn is not None:
            hbase_conn.close()
        consumer.close()


if __name__ == '__main__':
    main()
