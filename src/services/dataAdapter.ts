import { TransactionRow, FilterState, MetricsSummary, DashboardData, SegmentsData, CategoryInsightsData, CohortData, VersionType } from '../types';
import { AGE_GROUP_RANGES } from '../constants';
import dayjs from 'dayjs';

export function applyFilters(data: TransactionRow[], filters: FilterState): TransactionRow[] {
  return data.filter(row => {
    // Date range filter
    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      if (row.invoice_date < start || row.invoice_date > end) return false;
    }

    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(row.category)) {
      return false;
    }

    // Payment method filter
    if (filters.paymentMethods.length > 0 && !filters.paymentMethods.includes(row.payment_method)) {
      return false;
    }

    // Gender filter
    if (filters.gender !== 'All' && row.gender !== filters.gender) {
      return false;
    }

    // Age group filter
    if (filters.ageGroups.length > 0) {
      const inAgeGroup = filters.ageGroups.some(group => {
        const [min, max] = AGE_GROUP_RANGES[group];
        return row.age >= min && row.age <= max;
      });
      if (!inAgeGroup) return false;
    }

    return true;
  });
}

export function calculateMetrics(data: TransactionRow[]): MetricsSummary {
  const gmv = data.reduce((sum, row) => sum + row.quantity * row.price, 0);
  const orderCount = data.length;
  const uniqueBuyers = new Set(data.map(row => row.customer_id)).size;
  const totalItemsSold = data.reduce((sum, row) => sum + row.quantity, 0);
  const aov = orderCount > 0 ? gmv / orderCount : 0;
  const ipv = totalItemsSold > 0 ? gmv / totalItemsSold : 0;

  // Calculate repurchase rate
  const customerPurchases = new Map<string, number>();
  data.forEach(row => {
    customerPurchases.set(row.customer_id, (customerPurchases.get(row.customer_id) || 0) + 1);
  });
  const repeatCustomers = Array.from(customerPurchases.values()).filter(count => count >= 2).length;
  const repurchaseRate = uniqueBuyers > 0 ? repeatCustomers / uniqueBuyers : 0;

  return {
    gmv: Math.round(gmv * 100) / 100,
    orderCount,
    uniqueBuyers,
    totalItemsSold,
    aov: Math.round(aov * 100) / 100,
    ipv: Math.round(ipv * 100) / 100,
    repurchaseRate: Math.round(repurchaseRate * 10000) / 100
  };
}

export function getDashboardData(data: TransactionRow[], _version: VersionType): DashboardData {
  const kpis = calculateMetrics(data);

  // Trend data (daily)
  const trendMap = new Map<string, { gmv: number; count: number }>();
  data.forEach(row => {
    const existing = trendMap.get(row.invoice_date) || { gmv: 0, count: 0 };
    existing.gmv += row.quantity * row.price;
    existing.count += 1;
    trendMap.set(row.invoice_date, existing);
  });

  const trendData = Array.from(trendMap.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, { gmv, count }]) => ({
      date,
      value: Math.round(gmv * 100) / 100,
      orderCount: count
    }));

  // Category data
  const categoryMap = new Map<string, { gmv: number; count: number }>();
  data.forEach(row => {
    const existing = categoryMap.get(row.category) || { gmv: 0, count: 0 };
    existing.gmv += row.quantity * row.price;
    existing.count += 1;
    categoryMap.set(row.category, existing);
  });

  const categoryData = Array.from(categoryMap.entries())
    .map(([category, { gmv, count }]) => ({
      category,
      gmv: Math.round(gmv * 100) / 100,
      orderCount: count,
      percentage: 0
    }))
    .sort((a, b) => b.gmv - a.gmv);

  const totalGmv = categoryData.reduce((sum, cat) => sum + cat.gmv, 0);
  categoryData.forEach(cat => {
    cat.percentage = Math.round((cat.gmv / totalGmv) * 10000) / 100;
  });

  // Payment method data
  const paymentMap = new Map<string, { gmv: number; count: number }>();
  data.forEach(row => {
    const existing = paymentMap.get(row.payment_method) || { gmv: 0, count: 0 };
    existing.gmv += row.quantity * row.price;
    existing.count += 1;
    paymentMap.set(row.payment_method, existing);
  });

  const paymentMethodData = Array.from(paymentMap.entries())
    .map(([method, { gmv, count }]) => ({
      category: method,
      gmv: Math.round(gmv * 100) / 100,
      orderCount: count,
      percentage: 0
    }))
    .sort((a, b) => b.gmv - a.gmv);

  const totalPaymentGmv = paymentMethodData.reduce((sum, p) => sum + p.gmv, 0);
  paymentMethodData.forEach(p => {
    p.percentage = Math.round((p.gmv / totalPaymentGmv) * 10000) / 100;
  });

  // Age distribution
  const ageMap = new Map<number, number>();
  data.forEach(row => {
    ageMap.set(row.age, (ageMap.get(row.age) || 0) + 1);
  });

  const ageDistribution = Array.from(ageMap.entries())
    .map(([age, count]) => ({ age, count }))
    .sort((a, b) => a.age - b.age);

  // Calendar data (daily GMV)
  const calendarData = trendData.map(d => ({
    date: d.date,
    gmv: d.value
  }));

  // New vs Returning users (by date)
  const customerFirstPurchase = new Map<string, string>();
  const sortedData = [...data].sort((a, b) => a.invoice_date.localeCompare(b.invoice_date));

  sortedData.forEach(row => {
    if (!customerFirstPurchase.has(row.customer_id)) {
      customerFirstPurchase.set(row.customer_id, row.invoice_date);
    }
  });

  const userNewVsReturningMap = new Map<string, { new: number; returning: number }>();
  sortedData.forEach(row => {
    const existing = userNewVsReturningMap.get(row.invoice_date) || { new: 0, returning: 0 };
    if (customerFirstPurchase.get(row.customer_id) === row.invoice_date) {
      existing.new += 1;
    } else {
      existing.returning += 1;
    }
    userNewVsReturningMap.set(row.invoice_date, existing);
  });

  const userNewVsReturning = Array.from(userNewVsReturningMap.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, { new: newCount, returning }]) => ({
      date,
      new: newCount,
      returning
    }));

  // Order value distribution
  const orderValues = data.map(row => row.quantity * row.price);
  const orderValueRanges = [
    { range: '0-100', min: 0, max: 100 },
    { range: '100-500', min: 100, max: 500 },
    { range: '500-1000', min: 500, max: 1000 },
    { range: '1000-5000', min: 1000, max: 5000 },
    { range: '5000+', min: 5000, max: Infinity }
  ];

  const orderValueDistribution = orderValueRanges.map(range => ({
    range: range.range,
    count: orderValues.filter(v => v >= range.min && v < range.max).length
  }));

  // User GMV Pareto
  const userGmvMap = new Map<string, number>();
  data.forEach(row => {
    const gmv = row.quantity * row.price;
    userGmvMap.set(row.customer_id, (userGmvMap.get(row.customer_id) || 0) + gmv);
  });

  const userGmvList = Array.from(userGmvMap.values()).sort((a, b) => b - a);
  let cumulativeGmv = 0;
  const userGmvPareto = userGmvList.map((gmv, index) => {
    cumulativeGmv += gmv;
    return {
      rank: index + 1,
      gmv: Math.round(gmv * 100) / 100,
      cumulative: Math.round((cumulativeGmv / totalGmv) * 10000) / 100
    };
  });

  // Category growth (month over month)
  const categoryMonthMap = new Map<string, Map<string, number>>();
  data.forEach(row => {
    const month = row.invoice_date.substring(0, 7);
    if (!categoryMonthMap.has(row.category)) {
      categoryMonthMap.set(row.category, new Map());
    }
    const monthMap = categoryMonthMap.get(row.category)!;
    monthMap.set(month, (monthMap.get(month) || 0) + row.quantity * row.price);
  });

  const categoryGrowth = Array.from(categoryMonthMap.entries()).map(([category, monthMap]) => {
    const months = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    const growthRate = months.length > 1
      ? ((months[months.length - 1][1] - months[0][1]) / months[0][1]) * 100
      : 0;
    return { category, growthRate: Math.round(growthRate * 100) / 100 };
  }).sort((a, b) => b.growthRate - a.growthRate);

  return {
    kpis,
    trendData,
    categoryData,
    paymentMethodData,
    ageDistribution,
    calendarData,
    userNewVsReturning,
    orderValueDistribution,
    userGmvPareto,
    categoryGrowth
  };
}

export function getUserSegmentsData(data: TransactionRow[], _version: VersionType): SegmentsData {
  // Gender distribution
  const genderMap = new Map<string, { count: number; gmv: number }>();
  data.forEach(row => {
    const existing = genderMap.get(row.gender) || { count: 0, gmv: 0 };
    existing.count += 1;
    existing.gmv += row.quantity * row.price;
    genderMap.set(row.gender, existing);
  });

  const totalCount = data.length;
  const genderDistribution = Array.from(genderMap.entries()).map(([gender, { count, gmv }]) => ({
    segment: gender === 'Male' ? '男' : '女',
    count,
    percentage: Math.round((count / totalCount) * 10000) / 100,
    gmv: Math.round(gmv * 100) / 100
  }));

  // Age distribution
  const ageGroupMap = new Map<string, { count: number; gmv: number }>();
  data.forEach(row => {
    const ageGroup = Object.entries(AGE_GROUP_RANGES).find(([_, [min, max]]) => row.age >= min && row.age <= max)?.[0] || '未知';
    const existing = ageGroupMap.get(ageGroup) || { count: 0, gmv: 0 };
    existing.count += 1;
    existing.gmv += row.quantity * row.price;
    ageGroupMap.set(ageGroup, existing);
  });

  const ageDistribution = Array.from(ageGroupMap.entries()).map(([ageGroup, { count, gmv }]) => ({
    segment: ageGroup,
    count,
    percentage: Math.round((count / totalCount) * 10000) / 100,
    gmv: Math.round(gmv * 100) / 100
  }));

  // Payment method distribution
  const paymentMap = new Map<string, { count: number; gmv: number }>();
  data.forEach(row => {
    const existing = paymentMap.get(row.payment_method) || { count: 0, gmv: 0 };
    existing.count += 1;
    existing.gmv += row.quantity * row.price;
    paymentMap.set(row.payment_method, existing);
  });

  const paymentMethodDistribution = Array.from(paymentMap.entries()).map(([method, { count, gmv }]) => ({
    segment: method,
    count,
    percentage: Math.round((count / totalCount) * 10000) / 100,
    gmv: Math.round(gmv * 100) / 100
  }));

  // Age × Payment method matrix
  const agePaymentMatrix: Array<{ age: string;[key: string]: any }> = [];
  const agePaymentMap = new Map<string, Map<string, number>>();

  data.forEach(row => {
    const ageGroup = Object.entries(AGE_GROUP_RANGES).find(([_, [min, max]]) => row.age >= min && row.age <= max)?.[0] || '未知';
    if (!agePaymentMap.has(ageGroup)) {
      agePaymentMap.set(ageGroup, new Map());
    }
    const paymentMap = agePaymentMap.get(ageGroup)!;
    paymentMap.set(row.payment_method, (paymentMap.get(row.payment_method) || 0) + row.quantity * row.price);
  });

  Array.from(agePaymentMap.entries()).forEach(([ageGroup, paymentMap]) => {
    const row: any = { age: ageGroup };
    Array.from(paymentMap.entries()).forEach(([payment, gmv]) => {
      row[payment] = Math.round(gmv * 100) / 100;
    });
    agePaymentMatrix.push(row);
  });

  // Age × Category matrix
  const ageCategoryMatrix: Array<{ age: string;[key: string]: any }> = [];
  const ageCategoryMap = new Map<string, Map<string, number>>();

  data.forEach(row => {
    const ageGroup = Object.entries(AGE_GROUP_RANGES).find(([_, [min, max]]) => row.age >= min && row.age <= max)?.[0] || '未知';
    if (!ageCategoryMap.has(ageGroup)) {
      ageCategoryMap.set(ageGroup, new Map());
    }
    const categoryMap = ageCategoryMap.get(ageGroup)!;
    categoryMap.set(row.category, (categoryMap.get(row.category) || 0) + row.quantity * row.price);
  });

  Array.from(ageCategoryMap.entries()).forEach(([ageGroup, categoryMap]) => {
    const row: any = { age: ageGroup };
    Array.from(categoryMap.entries()).forEach(([category, gmv]) => {
      row[category] = Math.round(gmv * 100) / 100;
    });
    ageCategoryMatrix.push(row);
  });

  return {
    genderDistribution,
    ageDistribution,
    paymentMethodDistribution,
    agePaymentMatrix,
    ageCategoryMatrix
  };
}

export function getCategoryData(data: TransactionRow[], _version: VersionType): CategoryInsightsData {
  // Category trends by month
  const categoryMonthMap = new Map<string, Map<string, number>>();
  data.forEach(row => {
    const month = row.invoice_date.substring(0, 7);
    if (!categoryMonthMap.has(row.category)) {
      categoryMonthMap.set(row.category, new Map());
    }
    const monthMap = categoryMonthMap.get(row.category)!;
    monthMap.set(month, (monthMap.get(month) || 0) + row.quantity * row.price);
  });

  const allMonths = Array.from(new Set(data.map(row => row.invoice_date.substring(0, 7)))).sort();
  const categoryTrends: Array<{ date: string;[key: string]: any }> = [];

  allMonths.forEach(month => {
    const row: any = { date: month };
    Array.from(categoryMonthMap.entries()).forEach(([category, monthMap]) => {
      row[category] = Math.round((monthMap.get(month) || 0) * 100) / 100;
    });
    categoryTrends.push(row);
  });

  // Category AOV
  const categoryAovMap = new Map<string, { gmv: number; count: number }>();
  data.forEach(row => {
    const existing = categoryAovMap.get(row.category) || { gmv: 0, count: 0 };
    existing.gmv += row.quantity * row.price;
    existing.count += 1;
    categoryAovMap.set(row.category, existing);
  });

  const categoryAov = Array.from(categoryAovMap.entries())
    .map(([category, { gmv, count }]) => ({
      category,
      aov: Math.round((gmv / count) * 100) / 100
    }))
    .sort((a, b) => b.aov - a.aov);

  // Category growth
  const categoryGrowthMap = new Map<string, { first: number; last: number }>();
  Array.from(categoryMonthMap.entries()).forEach(([category, monthMap]) => {
    const months = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    if (months.length > 0) {
      categoryGrowthMap.set(category, {
        first: months[0][1],
        last: months[months.length - 1][1]
      });
    }
  });

  const categoryGrowth = Array.from(categoryGrowthMap.entries())
    .map(([category, { first, last }]) => ({
      category,
      growthRate: first > 0 ? Math.round(((last - first) / first) * 10000) / 100 : 0
    }))
    .sort((a, b) => b.growthRate - a.growthRate);

  // Treemap data
  const categoryGmvMap = new Map<string, number>();
  data.forEach(row => {
    categoryGmvMap.set(row.category, (categoryGmvMap.get(row.category) || 0) + row.quantity * row.price);
  });

  const categoryTreemap = Array.from(categoryGmvMap.entries())
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100
    }))
    .sort((a, b) => b.value - a.value);

  return {
    categoryTrends,
    categoryAov,
    categoryGrowth,
    categoryTreemap
  };
}

export function getCohortData(data: TransactionRow[]): CohortData[] {
  // Find first purchase date for each customer
  const customerFirstPurchase = new Map<string, string>();
  const sortedData = [...data].sort((a, b) => a.invoice_date.localeCompare(b.invoice_date));

  sortedData.forEach(row => {
    if (!customerFirstPurchase.has(row.customer_id)) {
      customerFirstPurchase.set(row.customer_id, row.invoice_date);
    }
  });

  // Group by cohort month
  const cohortMap = new Map<string, Set<string>>();
  sortedData.forEach(row => {
    const firstPurchaseDate = customerFirstPurchase.get(row.customer_id)!;
    const cohortMonth = firstPurchaseDate.substring(0, 7);

    if (!cohortMap.has(cohortMonth)) {
      cohortMap.set(cohortMonth, new Set());
    }
    cohortMap.get(cohortMonth)!.add(row.customer_id);
  });

  // Calculate retention for each cohort
  const cohortData: CohortData[] = [];
  Array.from(cohortMap.entries()).forEach(([cohortMonth, customers]) => {
    const cohortSize = customers.size;
    const retentionByMonth: Record<number, number> = {};

    const cohortMonthDate = dayjs(cohortMonth + '-01');
    const months = new Set<string>();
    sortedData.forEach(row => {
      months.add(row.invoice_date.substring(0, 7));
    });

    Array.from(months).sort().forEach(month => {
      const monthDate = dayjs(month + '-01');
      const monthDiff = monthDate.diff(cohortMonthDate, 'month');

      if (monthDiff >= 0) {
        const customersInMonth = new Set(
          sortedData
            .filter(row => row.invoice_date.substring(0, 7) === month && customers.has(row.customer_id))
            .map(row => row.customer_id)
        );
        retentionByMonth[monthDiff] = Math.round((customersInMonth.size / cohortSize) * 10000) / 100;
      }
    });

    cohortData.push({
      cohortMonth,
      cohortSize,
      retentionByMonth
    });
  });

  return cohortData.sort((a, b) => a.cohortMonth.localeCompare(b.cohortMonth));
}

// V2 专属：购物行为分析数据
export interface ShoppingBehaviorData {
  topCustomers: Array<{ customerId: string; totalGmv: number; orderCount: number; avgOrder: number }>;
  purchaseFrequency: Array<{ frequency: string; count: number; gmv: number }>;
  categoryPreference: Array<{ category: string; customerCount: number; avgGmv: number }>;
  paymentPreference: Array<{ method: string; count: number; percentage: number; avgAmount: number }>;
  weekdayAnalysis: Array<{ day: string; orderCount: number; gmv: number }>;
  monthlyTrend: Array<{ month: string; customers: number; gmv: number; orders: number }>;
}

export function getShoppingBehaviorData(data: TransactionRow[]): ShoppingBehaviorData {
  // Top customers by GMV
  const customerGmvMap = new Map<string, { gmv: number; orders: number }>();
  data.forEach(row => {
    const gmv = row.quantity * row.price;
    const existing = customerGmvMap.get(row.customer_id) || { gmv: 0, orders: 0 };
    existing.gmv += gmv;
    existing.orders += 1;
    customerGmvMap.set(row.customer_id, existing);
  });

  const topCustomers = Array.from(customerGmvMap.entries())
    .map(([customerId, { gmv, orders }]) => ({
      customerId: customerId.substring(0, 8) + '...',
      totalGmv: Math.round(gmv * 100) / 100,
      orderCount: orders,
      avgOrder: Math.round((gmv / orders) * 100) / 100
    }))
    .sort((a, b) => b.totalGmv - a.totalGmv)
    .slice(0, 10);

  // Purchase frequency distribution
  const customerOrderCount = new Map<string, number>();
  data.forEach(row => {
    customerOrderCount.set(row.customer_id, (customerOrderCount.get(row.customer_id) || 0) + 1);
  });

  const frequencyRanges = [
    { label: '1次购买', min: 1, max: 1 },
    { label: '2-3次', min: 2, max: 3 },
    { label: '4-5次', min: 4, max: 5 },
    { label: '6-10次', min: 6, max: 10 },
    { label: '10次以上', min: 11, max: Infinity }
  ];

  const purchaseFrequency = frequencyRanges.map(range => {
    const customers = Array.from(customerOrderCount.entries())
      .filter(([_, count]) => count >= range.min && count <= range.max);
    const count = customers.length;
    const gmv = customers.reduce((sum, [customerId]) => {
      return sum + (customerGmvMap.get(customerId)?.gmv || 0);
    }, 0);
    return { frequency: range.label, count, gmv: Math.round(gmv * 100) / 100 };
  });

  // Category preference analysis
  const categoryCustomerMap = new Map<string, Set<string>>();
  const categoryGmvMap = new Map<string, number>();
  data.forEach(row => {
    if (!categoryCustomerMap.has(row.category)) {
      categoryCustomerMap.set(row.category, new Set());
    }
    categoryCustomerMap.get(row.category)!.add(row.customer_id);
    categoryGmvMap.set(row.category, (categoryGmvMap.get(row.category) || 0) + row.quantity * row.price);
  });

  const categoryPreference = Array.from(categoryCustomerMap.entries())
    .map(([category, customers]) => ({
      category,
      customerCount: customers.size,
      avgGmv: Math.round(((categoryGmvMap.get(category) || 0) / customers.size) * 100) / 100
    }))
    .sort((a, b) => b.customerCount - a.customerCount);

  // Payment method preference
  const paymentCountMap = new Map<string, { count: number; gmv: number }>();
  data.forEach(row => {
    const existing = paymentCountMap.get(row.payment_method) || { count: 0, gmv: 0 };
    existing.count += 1;
    existing.gmv += row.quantity * row.price;
    paymentCountMap.set(row.payment_method, existing);
  });

  const totalOrders = data.length;
  const paymentPreference = Array.from(paymentCountMap.entries())
    .map(([method, { count, gmv }]) => ({
      method,
      count,
      percentage: Math.round((count / totalOrders) * 10000) / 100,
      avgAmount: Math.round((gmv / count) * 100) / 100
    }))
    .sort((a, b) => b.count - a.count);

  // Weekday analysis (using day of week from date)
  const weekdayMap = new Map<number, { orders: number; gmv: number }>();
  data.forEach(row => {
    const dayOfWeek = dayjs(row.invoice_date).day();
    const existing = weekdayMap.get(dayOfWeek) || { orders: 0, gmv: 0 };
    existing.orders += 1;
    existing.gmv += row.quantity * row.price;
    weekdayMap.set(dayOfWeek, existing);
  });

  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekdayAnalysis = Array.from(weekdayMap.entries())
    .map(([day, { orders, gmv }]) => ({
      day: dayNames[day],
      orderCount: orders,
      gmv: Math.round(gmv * 100) / 100
    }))
    .sort((a, b) => dayNames.indexOf(a.day) - dayNames.indexOf(b.day));

  // Monthly trend
  const monthlyMap = new Map<string, { customers: Set<string>; gmv: number; orders: number }>();
  data.forEach(row => {
    const month = row.invoice_date.substring(0, 7);
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { customers: new Set(), gmv: 0, orders: 0 });
    }
    const entry = monthlyMap.get(month)!;
    entry.customers.add(row.customer_id);
    entry.gmv += row.quantity * row.price;
    entry.orders += 1;
  });

  const monthlyTrend = Array.from(monthlyMap.entries())
    .map(([month, { customers, gmv, orders }]) => ({
      month,
      customers: customers.size,
      gmv: Math.round(gmv * 100) / 100,
      orders
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    topCustomers,
    purchaseFrequency,
    categoryPreference,
    paymentPreference,
    weekdayAnalysis,
    monthlyTrend
  };
}


