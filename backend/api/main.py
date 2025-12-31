"""
FastAPI Backend - RESTful API for E-commerce Analytics
Provides endpoints for the frontend dashboard to consume
"""

import json
from datetime import datetime
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import get_mysql_connection, get_redis_client
from models import (
    TransactionRow, MetricsSummary, CategoryData, 
    UserSegment, CohortData, TrendDataPoint, HealthResponse
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("[API] Starting FastAPI service...")
    yield
    print("[API] Shutting down...")


app = FastAPI(
    title="E-commerce Analytics API",
    description="RESTful API for e-commerce data visualization dashboard",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Health Check
# ============================================

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Check API and dependencies health"""
    mysql_status = "unknown"
    redis_status = "unknown"
    
    # Check MySQL
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        conn.close()
        mysql_status = "healthy"
    except Exception as e:
        mysql_status = f"error: {str(e)}"
    
    # Check Redis
    try:
        redis_client = get_redis_client()
        redis_client.ping()
        redis_status = "healthy"
    except Exception as e:
        redis_status = f"error: {str(e)}"
    
    return HealthResponse(
        status="ok" if mysql_status == "healthy" and redis_status == "healthy" else "degraded",
        mysql=mysql_status,
        redis=redis_status,
        timestamp=datetime.now().isoformat()
    )


# ============================================
# Transaction Endpoints
# ============================================

@app.get("/api/transactions", response_model=List[TransactionRow])
async def get_transactions(
    startDate: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    endDate: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    category: Optional[str] = Query(None, description="Category filter"),
    paymentMethod: Optional[str] = Query(None, description="Payment method filter"),
    gender: Optional[str] = Query(None, description="Gender filter"),
    limit: int = Query(1000, ge=1, le=10000, description="Max records to return")
):
    """Fetch transaction data with optional filters"""
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = "SELECT customer_id, gender, age, category, quantity, price, payment_method, invoice_date FROM transactions WHERE 1=1"
        params = []
        
        if startDate:
            query += " AND invoice_date >= %s"
            params.append(startDate)
        if endDate:
            query += " AND invoice_date <= %s"
            params.append(endDate)
        if category:
            query += " AND category = %s"
            params.append(category)
        if paymentMethod:
            query += " AND payment_method = %s"
            params.append(paymentMethod)
        if gender:
            query += " AND gender = %s"
            params.append(gender)
        
        query += " ORDER BY invoice_date DESC LIMIT %s"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # Convert date to string
        for row in rows:
            if row['invoice_date']:
                row['invoice_date'] = row['invoice_date'].strftime('%Y-%m-%d')
        
        cursor.close()
        conn.close()
        
        return rows
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Metrics Endpoints
# ============================================

@app.get("/api/metrics/summary")
async def get_metrics_summary(
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None)
):
    """Get aggregated KPI metrics"""
    try:
        # First try Redis cache for real-time data
        redis_client = get_redis_client()
        cached_gmv = redis_client.get('realtime:total_gmv')
        cached_orders = redis_client.get('realtime:total_orders')
        
        conn = get_mysql_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Build date filter
        date_filter = ""
        params = []
        if startDate:
            date_filter += " AND invoice_date >= %s"
            params.append(startDate)
        if endDate:
            date_filter += " AND invoice_date <= %s"
            params.append(endDate)
        
        # Get aggregated metrics
        cursor.execute(f"""
            SELECT 
                COALESCE(SUM(price * quantity), 0) as gmv,
                COUNT(*) as order_count,
                COUNT(DISTINCT customer_id) as unique_buyers,
                COALESCE(SUM(quantity), 0) as items_sold
            FROM transactions
            WHERE 1=1 {date_filter}
        """, params)
        
        result = cursor.fetchone()
        
        # Calculate additional metrics
        gmv = float(result['gmv'] or 0)
        order_count = int(result['order_count'] or 0)
        unique_buyers = int(result['unique_buyers'] or 0)
        items_sold = int(result['items_sold'] or 0)
        aov = gmv / max(1, order_count)
        ipv = gmv / max(1, items_sold)
        
        # Get repurchase rate
        cursor.execute(f"""
            SELECT COUNT(*) as repeat_buyers
            FROM (
                SELECT customer_id, COUNT(*) as orders
                FROM transactions
                WHERE 1=1 {date_filter}
                GROUP BY customer_id
                HAVING orders > 1
            ) t
        """, params)
        
        repeat_result = cursor.fetchone()
        repeat_buyers = int(repeat_result['repeat_buyers'] or 0)
        repurchase_rate = repeat_buyers / max(1, unique_buyers)
        
        cursor.close()
        conn.close()
        
        return {
            "gmv": round(gmv, 2),
            "orderCount": order_count,
            "uniqueBuyers": unique_buyers,
            "totalItemsSold": items_sold,
            "aov": round(aov, 2),
            "ipv": round(ipv, 2),
            "repurchaseRate": round(repurchase_rate, 4)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/trends")
async def get_trends(
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None)
):
    """Get daily trend data"""
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor(dictionary=True)
        
        date_filter = ""
        params = []
        if startDate:
            date_filter += " AND invoice_date >= %s"
            params.append(startDate)
        if endDate:
            date_filter += " AND invoice_date <= %s"
            params.append(endDate)
        
        cursor.execute(f"""
            SELECT 
                invoice_date as date,
                SUM(price * quantity) as gmv,
                COUNT(*) as order_count,
                COUNT(DISTINCT customer_id) as unique_buyers
            FROM transactions
            WHERE 1=1 {date_filter}
            GROUP BY invoice_date
            ORDER BY invoice_date
        """, params)
        
        rows = cursor.fetchall()
        
        result = []
        for row in rows:
            result.append({
                "date": row['date'].strftime('%Y-%m-%d'),
                "gmv": float(row['gmv'] or 0),
                "orderCount": int(row['order_count'] or 0),
                "uniqueBuyers": int(row['unique_buyers'] or 0)
            })
        
        cursor.close()
        conn.close()
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Analytics Endpoints
# ============================================

@app.get("/api/analytics/categories")
async def get_category_analytics(
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None)
):
    """Get category breakdown data"""
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor(dictionary=True)
        
        date_filter = ""
        params = []
        if startDate:
            date_filter += " AND invoice_date >= %s"
            params.append(startDate)
        if endDate:
            date_filter += " AND invoice_date <= %s"
            params.append(endDate)
        
        cursor.execute(f"""
            SELECT 
                category,
                SUM(price * quantity) as gmv,
                COUNT(*) as order_count
            FROM transactions
            WHERE 1=1 {date_filter}
            GROUP BY category
            ORDER BY gmv DESC
        """, params)
        
        rows = cursor.fetchall()
        
        # Calculate percentages
        total_gmv = sum(float(row['gmv'] or 0) for row in rows)
        
        result = []
        for row in rows:
            gmv = float(row['gmv'] or 0)
            result.append({
                "category": row['category'],
                "gmv": round(gmv, 2),
                "orderCount": int(row['order_count'] or 0),
                "percentage": round(gmv / max(1, total_gmv) * 100, 2)
            })
        
        cursor.close()
        conn.close()
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/segments")
async def get_user_segments():
    """Get user segmentation data"""
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                segment,
                COUNT(*) as count,
                SUM(total_gmv) as gmv
            FROM user_segments
            GROUP BY segment
            ORDER BY gmv DESC
        """)
        
        rows = cursor.fetchall()
        
        # Calculate percentages
        total_count = sum(int(row['count'] or 0) for row in rows)
        
        result = []
        for row in rows:
            count = int(row['count'] or 0)
            result.append({
                "segment": row['segment'],
                "count": count,
                "percentage": round(count / max(1, total_count) * 100, 2),
                "gmv": float(row['gmv'] or 0)
            })
        
        cursor.close()
        conn.close()
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/cohort")
async def get_cohort_data():
    """Get cohort retention data"""
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get cohort data from cohort_retention table
        cursor.execute("""
            SELECT cohort_month, cohort_size, month_offset, retention_rate
            FROM cohort_retention
            ORDER BY cohort_month, month_offset
        """)
        
        rows = cursor.fetchall()
        
        # Group by cohort month
        cohorts = {}
        for row in rows:
            month = row['cohort_month']
            if month not in cohorts:
                cohorts[month] = {
                    "cohortMonth": month,
                    "cohortSize": int(row['cohort_size'] or 0),
                    "retentionByMonth": {}
                }
            cohorts[month]["retentionByMonth"][row['month_offset']] = float(row['retention_rate'] or 0)
        
        cursor.close()
        conn.close()
        
        return list(cohorts.values())
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/age-distribution")
async def get_age_distribution():
    """Get age distribution data"""
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN age BETWEEN 18 AND 24 THEN '18-24岁'
                    WHEN age BETWEEN 25 AND 34 THEN '25-34岁'
                    WHEN age BETWEEN 35 AND 44 THEN '35-44岁'
                    WHEN age BETWEEN 45 AND 54 THEN '45-54岁'
                    ELSE '55岁以上'
                END as age_group,
                COUNT(DISTINCT customer_id) as count,
                SUM(price * quantity) as gmv
            FROM transactions
            GROUP BY age_group
            ORDER BY FIELD(age_group, '18-24岁', '25-34岁', '35-44岁', '45-54岁', '55岁以上')
        """)
        
        rows = cursor.fetchall()
        
        total_count = sum(int(row['count'] or 0) for row in rows)
        
        result = []
        for row in rows:
            count = int(row['count'] or 0)
            result.append({
                "segment": row['age_group'],
                "count": count,
                "percentage": round(count / max(1, total_count) * 100, 2),
                "gmv": float(row['gmv'] or 0)
            })
        
        cursor.close()
        conn.close()
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/payment-methods")
async def get_payment_method_distribution():
    """Get payment method distribution"""
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                payment_method,
                COUNT(*) as order_count,
                SUM(price * quantity) as gmv
            FROM transactions
            GROUP BY payment_method
            ORDER BY gmv DESC
        """)
        
        rows = cursor.fetchall()
        
        total_gmv = sum(float(row['gmv'] or 0) for row in rows)
        
        result = []
        for row in rows:
            gmv = float(row['gmv'] or 0)
            result.append({
                "category": row['payment_method'],
                "gmv": round(gmv, 2),
                "orderCount": int(row['order_count'] or 0),
                "percentage": round(gmv / max(1, total_gmv) * 100, 2)
            })
        
        cursor.close()
        conn.close()
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Real-time Endpoints (from Redis)
# ============================================

@app.get("/api/realtime/latest")
async def get_realtime_latest():
    """Get real-time metrics from Redis cache"""
    try:
        redis_client = get_redis_client()
        
        total_gmv = redis_client.get('realtime:total_gmv') or '0'
        total_orders = redis_client.get('realtime:total_orders') or '0'
        last_updated = redis_client.get('realtime:last_updated') or None
        
        # Get latest transactions
        latest_transactions = redis_client.lrange('realtime:latest_transactions', 0, 9)
        transactions = [json.loads(t) for t in latest_transactions]
        
        return {
            "total_gmv": float(total_gmv),
            "total_orders": int(total_orders),
            "last_updated": last_updated,
            "latest_transactions": transactions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
