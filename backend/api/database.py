"""
Database Connection Module
Provides MySQL, Redis, and HBase connection utilities
"""

import os
import mysql.connector
from mysql.connector import pooling
import redis

try:
    import happybase
    HBASE_AVAILABLE = True
except ImportError:
    HBASE_AVAILABLE = False

# MySQL Configuration
MYSQL_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'port': int(os.getenv('MYSQL_PORT', '3306')),
    'user': os.getenv('MYSQL_USER', 'ecommerce_user'),
    'password': os.getenv('MYSQL_PASSWORD', 'ecommerce_pass'),
    'database': os.getenv('MYSQL_DATABASE', 'ecommerce')
}

# Redis Configuration
REDIS_CONFIG = {
    'host': os.getenv('REDIS_HOST', 'localhost'),
    'port': int(os.getenv('REDIS_PORT', '6379'))
}

# HBase Configuration
HBASE_CONFIG = {
    'host': os.getenv('HBASE_HOST', 'localhost'),
    'port': int(os.getenv('HBASE_PORT', '9090'))
}

# Connection pool for MySQL
mysql_pool = None

def get_mysql_pool():
    """Get or create MySQL connection pool"""
    global mysql_pool
    if mysql_pool is None:
        mysql_pool = pooling.MySQLConnectionPool(
            pool_name="ecommerce_pool",
            pool_size=5,
            pool_reset_session=True,
            **MYSQL_CONFIG
        )
    return mysql_pool


def get_mysql_connection():
    """Get a connection from the pool"""
    return get_mysql_pool().get_connection()


# Redis client (singleton)
redis_client = None

def get_redis_client():
    """Get Redis client"""
    global redis_client
    if redis_client is None:
        redis_client = redis.Redis(
            host=REDIS_CONFIG['host'],
            port=REDIS_CONFIG['port'],
            decode_responses=True
        )
    return redis_client


# HBase client (singleton)
hbase_connection = None

def get_hbase_connection():
    """Get HBase connection"""
    global hbase_connection
    if not HBASE_AVAILABLE:
        return None

    if hbase_connection is None:
        try:
            hbase_connection = happybase.Connection(
                HBASE_CONFIG['host'],
                HBASE_CONFIG['port']
            )
        except Exception as e:
            print(f"[Database] Warning: Failed to connect to HBase: {e}")
            return None

    return hbase_connection
