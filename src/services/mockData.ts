import { TransactionRow } from '../types';
import { CATEGORIES, PAYMENT_METHODS } from '../constants';
import dayjs from 'dayjs';

// Weighted random selection
function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Generate random date between start and end
function randomDate(start: Date, end: Date): string {
  const time = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return dayjs(new Date(time)).format('YYYY-MM-DD');
}

// Generate age with concentration 70% between 25-44
function generateAge(): number {
  const rand = Math.random();
  if (rand < 0.7) {
    return Math.floor(25 + Math.random() * 20); // 25-44
  } else if (rand < 0.85) {
    return Math.floor(18 + Math.random() * 7); // 18-24
  } else if (rand < 0.95) {
    return Math.floor(45 + Math.random() * 10); // 45-54
  } else {
    return Math.floor(55 + Math.random() * 20); // 55+
  }
}

// Generate price based on category
function generatePrice(category: string): number {
  const priceRanges: Record<string, [number, number]> = {
    '电子产品': [500, 5000],
    '服装鞋帽': [50, 500],
    '食品饮料': [10, 100],
    '家居用品': [50, 1000],
    '美妆护肤': [30, 500],
    '运动户外': [100, 2000],
    '图书音像': [20, 200],
    '母婴产品': [50, 800]
  };
  const [min, max] = priceRanges[category] || [50, 500];
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

// Generate quantity with Poisson-like distribution
function generateQuantity(): number {
  const rand = Math.random();
  if (rand < 0.6) return 1;
  if (rand < 0.85) return 2;
  if (rand < 0.95) return 3;
  return Math.floor(4 + Math.random() * 3);
}

// Check if date is weekend
function isWeekend(date: string): boolean {
  const day = dayjs(date).day();
  return day === 0 || day === 6;
}

// Get seasonality multiplier for month
function getSeasonalityMultiplier(date: string): number {
  const month = dayjs(date).month() + 1;
  const seasonality: Record<number, number> = {
    1: 0.9,
    2: 1.2,
    3: 1.0,
    4: 0.95,
    5: 1.0,
    6: 0.95,
    7: 0.9,
    8: 0.95,
    9: 1.0,
    10: 1.05,
    11: 1.4,
    12: 1.5
  };
  return seasonality[month] || 1.0;
}

export function generateMockData(): TransactionRow[] {
  const data: TransactionRow[] = [];
  const startDate = new Date('2022-01-01');
  const endDate = new Date('2023-03-31');
  const targetCount = 10000;
  
  // Category weights (Pareto: top 3 = 60-70% of volume)
  const categoryWeights = [0.25, 0.22, 0.18, 0.12, 0.10, 0.08, 0.03, 0.02];
  
  // Payment method weights
  const paymentWeights = [0.40, 0.35, 0.25];
  
  // Customer tracking for repeat purchases
  const customerMap = new Map<string, { firstDate: string; purchaseCount: number }>();
  
  for (let i = 0; i < targetCount; i++) {
    const date = randomDate(startDate, endDate);
    const seasonality = getSeasonalityMultiplier(date);
    const weekendBoost = isWeekend(date) ? 1.25 : 1.0;
    
    // Adjust transaction probability based on seasonality and day of week
    if (Math.random() > (seasonality * weekendBoost * 0.8)) {
      continue;
    }
    
    const category = weightedRandom(CATEGORIES, categoryWeights);
    const paymentMethod = weightedRandom(PAYMENT_METHODS, paymentWeights);
    const gender = Math.random() > 0.5 ? 'Male' : 'Female';
    const age = generateAge();
    const quantity = generateQuantity();
    const price = generatePrice(category);
    
    // Generate customer ID with repeat purchase logic
    let customerId: string;
    const existingCustomers = Array.from(customerMap.keys());
    
    // 35% chance to be repeat customer
    if (existingCustomers.length > 0 && Math.random() < 0.35) {
      customerId = existingCustomers[Math.floor(Math.random() * existingCustomers.length)];
      const customer = customerMap.get(customerId)!;
      customer.purchaseCount++;
    } else {
      customerId = `CUST_${String(data.length + 1).padStart(6, '0')}`;
      customerMap.set(customerId, { firstDate: date, purchaseCount: 1 });
    }
    
    data.push({
      customer_id: customerId,
      gender,
      age,
      category,
      quantity,
      price,
      payment_method: paymentMethod,
      invoice_date: date
    });
  }
  
  return data.slice(0, targetCount);
}

