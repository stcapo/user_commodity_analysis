"""
Pydantic Models for API Request/Response
"""

from typing import Optional, List
from datetime import date
from pydantic import BaseModel


class TransactionRow(BaseModel):
    """Transaction data matching frontend interface"""
    customer_id: str
    gender: str
    age: int
    category: str
    quantity: int
    price: float
    payment_method: str
    invoice_date: str


class MetricsSummary(BaseModel):
    """KPI metrics summary"""
    gmv: float
    orderCount: int
    uniqueBuyers: int
    totalItemsSold: int
    aov: float
    ipv: float
    repurchaseRate: float


class CategoryData(BaseModel):
    """Category performance data"""
    category: str
    gmv: float
    orderCount: int
    percentage: Optional[float] = None


class UserSegment(BaseModel):
    """User segment data"""
    segment: str
    count: int
    percentage: float
    gmv: float


class CohortData(BaseModel):
    """Cohort retention data"""
    cohortMonth: str
    cohortSize: int
    retentionByMonth: dict


class TrendDataPoint(BaseModel):
    """Time series data point"""
    date: str
    value: float


class FilterParams(BaseModel):
    """Filter parameters for queries"""
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    categories: Optional[List[str]] = None
    paymentMethods: Optional[List[str]] = None
    gender: Optional[str] = None
    limit: Optional[int] = 1000


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    mysql: str
    redis: str
    timestamp: str
