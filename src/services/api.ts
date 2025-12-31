import { TransactionRow } from '../types';
import { generateMockData } from './mockData';

// This is the only file that needs to be modified when integrating with a real API
// Replace the generateMockData() call with actual API calls

let cachedData: TransactionRow[] | null = null;

export async function fetchTransactionData(): Promise<TransactionRow[]> {
  // If you have cached data, return it
  if (cachedData) {
    return cachedData;
  }
  
  // TODO: Replace this with actual API call
  // Example:
  // const response = await fetch('/api/transactions');
  // const data = await response.json();
  // cachedData = data;
  // return data;
  
  // For now, use mock data
  cachedData = generateMockData();
  return cachedData;
}

export function clearCache(): void {
  cachedData = null;
}

// Example API integration guide:
// 
// 1. Replace generateMockData() with your API endpoint:
//    const response = await fetch('https://your-api.com/api/transactions');
//    const data = await response.json();
//
// 2. Add error handling:
//    if (!response.ok) {
//      throw new Error(`API Error: ${response.statusText}`);
//    }
//
// 3. Transform API response to match TransactionRow interface:
//    const transactions = data.map(item => ({
//      customer_id: item.customerId,
//      gender: item.gender,
//      age: item.age,
//      category: item.productCategory,
//      quantity: item.qty,
//      price: item.unitPrice,
//      payment_method: item.paymentType,
//      invoice_date: item.transactionDate
//    }));
//
// 4. Add authentication if needed:
//    const response = await fetch('https://your-api.com/api/transactions', {
//      headers: {
//        'Authorization': `Bearer ${token}`,
//        'Content-Type': 'application/json'
//      }
//    });

