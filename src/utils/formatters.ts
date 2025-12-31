import dayjs from 'dayjs';

export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `¥${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `¥${(value / 1000).toFixed(2)}K`;
  }
  return `¥${value.toFixed(2)}`;
}

export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toFixed(0);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatDate(date: string, format: string = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format);
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} 至 ${formatDate(endDate)}`;
}

export function formatShortNumber(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  return value.toString();
}

export function formatTrend(value: number): string {
  if (value > 0) {
    return `↑ ${value.toFixed(2)}%`;
  } else if (value < 0) {
    return `↓ ${Math.abs(value).toFixed(2)}%`;
  }
  return '→ 0%';
}

