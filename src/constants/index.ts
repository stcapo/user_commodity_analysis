// Product categories
export const CATEGORIES = [
  '电子产品',
  '服装鞋帽',
  '食品饮料',
  '家居用品',
  '美妆护肤',
  '运动户外',
  '图书音像',
  '母婴产品'
];

// Payment methods
export const PAYMENT_METHODS = [
  '信用卡',
  '数字钱包',
  '现金'
];

// Age groups
export const AGE_GROUPS = [
  '18-24岁',
  '25-34岁',
  '35-44岁',
  '45-54岁',
  '55岁以上'
];

// Age group ranges
export const AGE_GROUP_RANGES: Record<string, [number, number]> = {
  '18-24岁': [18, 24],
  '25-34岁': [25, 34],
  '35-44岁': [35, 44],
  '45-54岁': [45, 54],
  '55岁以上': [55, 120]
};

// Date format
export const DATE_FORMAT = 'YYYY-MM-DD';

// Mock data date range
export const MOCK_DATA_START_DATE = '2022-01-01';
export const MOCK_DATA_END_DATE = '2023-03-31';

// Chart colors
export const CHART_COLORS_V1 = [
  '#00D9FF',
  '#00FF88',
  '#FF006E',
  '#FFB700',
  '#00B4FF',
  '#FF4D4D',
  '#00E5FF',
  '#FF8C42'
];

export const CHART_COLORS_V2 = [
  '#1890FF',
  '#52C41A',
  '#FA8C16',
  '#F5222D',
  '#722ED1',
  '#13C2C2',
  '#EB2F96',
  '#1890FF'
];

// Navigation items
export const NAV_ITEMS = [
  { key: 'dashboard', label: '总览大盘', path: '/' },
  { key: 'users', label: '用户画像', path: '/users' },
  { key: 'category', label: '品类洞察', path: '/category' },
  { key: 'cohort', label: '复购分析', path: '/cohort' }
];

