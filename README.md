# 电商行为BI分析平台 (ecom-behavior-bi-dual)

一个生产级别的电商数据可视化分析平台，支持双版本主题切换（深色分析版V1和浅色商业版V2）。

## 🚀 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

应用将自动在浏览器中打开，访问 http://localhost:5173

### 构建生产版本
```bash
npm run build
```

## 📋 项目特性

### 双版本主题系统
- **V1 - 深色分析版**: 采用玻璃态设计，深蓝紫色调，适合数据分析师
- **V2 - 浅色商业版**: 清爽编辑风格，专业蓝灰色调，适合管理层展示

### 核心功能
- ✅ 6个V1专属图表 + 6个V2专属图表
- ✅ 全局筛选系统（日期、品类、支付方式、性别、年龄段）
- ✅ 实时数据聚合和计算
- ✅ 页面导出为PNG功能
- ✅ 响应式设计（桌面、平板、手机）
- ✅ 完整的队列分析和留存追踪

### 页面结构
1. **总览大盘** - KPI概览 + 6个核心图表
2. **用户画像** - 性别、年龄、支付方式分布分析
3. **品类洞察** - 品类趋势、增长排行、客单价分析
4. **复购分析** - 队列留存分析和复购率追踪

## 📊 数据指标

### KPI指标
- **GMV** - 商品交易总额
- **订单数** - 总交易笔数
- **买家数** - 去重客户数
- **总销量** - 商品总件数
- **客单价(AOV)** - 平均订单价值
- **件单价(IPV)** - 平均商品价格
- **复购率** - 重复购买客户占比

### 分析维度
- 时间维度：日、周、月级别趋势
- 商品维度：品类分布、增长排行
- 用户维度：性别、年龄、支付方式
- 行为维度：队列分析、留存率、复购间隔

## 🔧 API集成指南

### 替换模拟数据

编辑 `src/services/api.ts` 文件，将 `generateMockData()` 替换为实际API调用：

```typescript
export async function fetchTransactionData(): Promise<TransactionRow[]> {
  const response = await fetch('https://your-api.com/api/transactions');
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // 转换API响应格式
  return data.map(item => ({
    customer_id: item.customerId,
    gender: item.gender,
    age: item.age,
    category: item.productCategory,
    quantity: item.qty,
    price: item.unitPrice,
    payment_method: item.paymentType,
    invoice_date: item.transactionDate
  }));
}
```

### 数据格式要求

API必须返回符合以下接口的数据：

```typescript
interface TransactionRow {
  customer_id: string;      // 客户ID
  gender: 'Male' | 'Female'; // 性别
  age: number;              // 年龄
  category: string;         // 商品类别
  quantity: number;         // 购买数量
  price: number;            // 单价
  payment_method: string;   // 支付方式
  invoice_date: string;     // 交易日期 (YYYY-MM-DD)
}
```

## 📁 项目结构

```
src/
├── main.tsx                 # 应用入口
├── App.tsx                  # 路由配置
├── styles/
│   ├── global.css          # 全局样式
│   └── themes.ts           # V1/V2主题配置
├── layout/
│   ├── AppLayout.tsx       # 主布局
│   ├── TopBar.tsx          # 顶部导航栏
│   └── SideNav.tsx         # 侧边栏导航
├── components/
│   ├── common/             # 通用组件
│   ├── cards/              # 卡片组件
│   └── charts/             # 图表组件
├── pages/                  # 页面组件
├── services/
│   ├── api.ts             # API接口（修改此文件集成真实API）
│   ├── mockData.ts        # 模拟数据生成
│   └── dataAdapter.ts     # 数据转换层
├── hooks/                 # React自定义Hook
├── utils/                 # 工具函数
├── types/                 # TypeScript类型定义
└── constants/             # 常量定义
```

## 🎨 主题定制

### 修改V1主题（深色）
编辑 `src/styles/themes.ts` 中的 `themeV1` 对象：

```typescript
export const themeV1: ThemeConfig = {
  token: {
    colorPrimary: '#00D9FF',  // 主色调
    colorBgBase: '#0a0e27',   // 背景色
    // ... 其他配置
  }
};
```

### 修改V2主题（浅色）
编辑 `src/styles/themes.ts` 中的 `themeV2` 对象。

## 📈 性能优化

- React.memo 防止不必要的重新渲染
- useMemo 缓存昂贵的计算
- 防抖处理筛选变化
- 图表组件懒加载

## 🌐 浏览器兼容性

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 📝 许可证

MIT

## 🤝 支持

如有问题或建议，请提交Issue或Pull Request。

