// Transaction data structure
export interface TransactionRow {
  customer_id: string;
  gender: 'Male' | 'Female';
  age: number;
  category: string;
  quantity: number;
  price: number;
  payment_method: string;
  invoice_date: string; // YYYY-MM-DD format
}

// Filter state
export interface FilterState {
  dateRange: [string, string] | null;
  categories: string[];
  paymentMethods: string[];
  gender: 'All' | 'Male' | 'Female';
  ageGroups: string[];
}

// Metrics summary
export interface MetricsSummary {
  gmv: number;
  orderCount: number;
  uniqueBuyers: number;
  totalItemsSold: number;
  aov: number;
  ipv: number;
  repurchaseRate: number;
}

// KPI Card data
export interface KPIData {
  label: string;
  value: number | string;
  unit?: string;
  trend?: number;
  trendLabel?: string;
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

export interface CategoryData {
  category: string;
  gmv: number;
  orderCount: number;
  percentage?: number;
}

export interface UserSegment {
  segment: string;
  count: number;
  percentage: number;
  gmv: number;
}

export interface CohortData {
  cohortMonth: string;
  cohortSize: number;
  retentionByMonth: Record<number, number>;
}

export interface DashboardData {
  kpis: MetricsSummary;
  trendData: ChartDataPoint[];
  categoryData: CategoryData[];
  paymentMethodData: CategoryData[];
  ageDistribution: Array<{ age: number; count: number }>;
  calendarData: Array<{ date: string; gmv: number }>;
  userNewVsReturning: Array<{ date: string; new: number; returning: number }>;
  orderValueDistribution: Array<{ range: string; count: number }>;
  userGmvPareto: Array<{ rank: number; gmv: number; cumulative: number }>;
  categoryGrowth: Array<{ category: string; growthRate: number }>;
}

export interface SegmentsData {
  genderDistribution: UserSegment[];
  ageDistribution: UserSegment[];
  paymentMethodDistribution: UserSegment[];
  agePaymentMatrix: Array<{ age: string; [key: string]: any }>;
  ageCategoryMatrix: Array<{ age: string; [key: string]: any }>;
}

export interface CategoryInsightsData {
  categoryTrends: Array<{ date: string; [key: string]: any }>;
  categoryAov: Array<{ category: string; aov: number }>;
  categoryGrowth: Array<{ category: string; growthRate: number }>;
  categoryTreemap: Array<{ name: string; value: number; children?: any[] }>;
}

export type VersionType = 'v1' | 'v2';

