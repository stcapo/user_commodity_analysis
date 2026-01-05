#!/bin/bash

# HBase Initialization Script
# Creates necessary tables for the e-commerce analytics system

echo "[HBase] Waiting for HBase to start..."
sleep 30

echo "[HBase] Creating tables..."

hbase shell << EOF
# Create transactions table for raw data storage
create 'transactions', 'cf'

# Create customer features table
create 'customer_features', 'cf'

# Create ML predictions table
create 'ml_predictions', 'cf'

# Enable compression for better storage efficiency
alter 'transactions', {NAME => 'cf', COMPRESSION => 'SNAPPY'}

# List all tables to verify
list

exit
EOF

echo "[HBase] Initialization complete!"

