-- MySQL Schema Initialization for E-commerce Analytics

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    gender ENUM('Male', 'Female') NOT NULL,
    age INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    invoice_time TIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_customer (customer_id),
    INDEX idx_date (invoice_date),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create daily metrics aggregation table
CREATE TABLE IF NOT EXISTS daily_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    metric_date DATE NOT NULL UNIQUE,
    gmv DECIMAL(15, 2) NOT NULL DEFAULT 0,
    order_count INT NOT NULL DEFAULT 0,
    unique_buyers INT NOT NULL DEFAULT 0,
    items_sold INT NOT NULL DEFAULT 0,
    aov DECIMAL(10, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (metric_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create category metrics table
CREATE TABLE IF NOT EXISTS category_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    metric_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    gmv DECIMAL(15, 2) NOT NULL DEFAULT 0,
    order_count INT NOT NULL DEFAULT 0,
    unique_buyers INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_date_category (metric_date, category),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create user segments table for ML results
CREATE TABLE IF NOT EXISTS user_segments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL UNIQUE,
    segment VARCHAR(50) NOT NULL,
    rfm_score INT DEFAULT NULL,
    total_orders INT DEFAULT 0,
    total_gmv DECIMAL(15, 2) DEFAULT 0,
    last_order_date DATE DEFAULT NULL,
    predicted_churn_risk DECIMAL(5, 4) DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_segment (segment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create cohort analysis table
CREATE TABLE IF NOT EXISTS cohort_retention (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cohort_month VARCHAR(7) NOT NULL,
    cohort_size INT NOT NULL DEFAULT 0,
    month_offset INT NOT NULL,
    retained_users INT NOT NULL DEFAULT 0,
    retention_rate DECIMAL(5, 4) NOT NULL DEFAULT 0,
    UNIQUE KEY uk_cohort_offset (cohort_month, month_offset),
    INDEX idx_cohort (cohort_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create real-time metrics snapshot table
CREATE TABLE IF NOT EXISTS realtime_snapshot (
    id INT PRIMARY KEY DEFAULT 1,
    total_gmv DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_orders INT NOT NULL DEFAULT 0,
    total_buyers INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Initialize realtime snapshot
INSERT INTO realtime_snapshot (id, total_gmv, total_orders, total_buyers) 
VALUES (1, 0, 0, 0)
ON DUPLICATE KEY UPDATE id=id;
