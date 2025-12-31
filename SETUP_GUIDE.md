# 电商行为BI分析平台 - 完整设置指南

## 📦 项目安装

### 1. 克隆或下载项目
```bash
cd /path/to/project
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

应用将自动在浏览器中打开，访问 http://localhost:5173

### 4. 构建生产版本
```bash
npm run build
```

生成的文件在 `dist/` 目录中。

## 🔌 API集成步骤

### 第一步：修改API服务文件

编辑 `src/services/api.ts` 文件，将模拟数据替换为真实API调用：

```typescript
export async function fetchTransactionData(): Promise<TransactionRow[]> {
  try {
    const response = await fetch('https://your-api.com/api/transactions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${YOUR_API_TOKEN}` // 如果需要认证
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // 转换API响应格式为应用所需格式
    const transactions = data.map(item => ({
      customer_id: item.customerId,
      gender: item.gender === 'M' ? 'Male' : 'Female',
      age: item.age,
      category: item.productCategory,
      quantity: item.qty,
      price: item.unitPrice,
      payment_method: item.paymentType,
      invoice_date: item.transactionDate // 必须是 YYYY-MM-DD 格式
    }));

    return transactions;
  } catch (error) {
    console.error('Failed to fetch transaction data:', error);
    throw error;
  }
}
```

### 第二步：验证数据格式

确保API返回的数据符合以下格式：

```typescript
interface TransactionRow {
  customer_id: string;      // 唯一客户ID
  gender: 'Male' | 'Female'; // 性别
  age: number;              // 年龄（18-100）
  category: string;         // 商品类别
  quantity: number;         // 购买数量
  price: number;            // 单价（¥）
  payment_method: string;   // 支付方式
  invoice_date: string;     // 交易日期（YYYY-MM-DD）
}
```

### 第三步：处理错误和加载状态

API服务已内置错误处理，应用会自动显示错误消息。

## 🎨 主题定制

### 修改V1主题（深色分析版）

编辑 `src/styles/themes.ts`：

```typescript
export const themeV1: ThemeConfig = {
  token: {
    colorPrimary: '#00D9FF',      // 主色调
    colorBgBase: '#0a0e27',       // 背景色
    colorTextBase: '#ffffff',     // 文字色
    // ... 其他配置
  }
};
```

### 修改V2主题（浅色商业版）

编辑 `src/styles/themes.ts` 中的 `themeV2` 对象。

## 📊 数据聚合说明

所有数据聚合和计算在 `src/services/dataAdapter.ts` 中进行：

- `applyFilters()` - 应用全局筛选
- `calculateMetrics()` - 计算KPI指标
- `getDashboardData()` - 生成仪表板数据
- `getUserSegmentsData()` - 生成用户分析数据
- `getCategoryData()` - 生成品类分析数据
- `getCohortData()` - 生成队列分析数据

## 🚀 部署

### 部署到Vercel（推荐）

1. 推送代码到GitHub
2. 在Vercel中导入项目
3. 设置环境变量（如API密钥）
4. 自动部署

### 部署到其他服务器

1. 运行 `npm run build`
2. 上传 `dist/` 目录到服务器
3. 配置Web服务器（Nginx/Apache）指向 `dist/index.html`

## 🔐 环境变量

如需使用环境变量，创建 `.env` 文件：

```
VITE_API_URL=https://your-api.com
VITE_API_TOKEN=your_token_here
```

在代码中使用：

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

## 📱 响应式设计

应用支持以下断点：
- 手机：< 576px
- 平板：576px - 992px
- 桌面：> 992px

## 🐛 调试

启用浏览器开发者工具查看：
- 网络请求
- 控制台错误
- React组件树（需要React DevTools）

## 📞 常见问题

**Q: 如何修改图表颜色？**
A: 编辑 `src/constants/index.ts` 中的 `CHART_COLORS_V1` 和 `CHART_COLORS_V2`

**Q: 如何添加新的筛选条件？**
A: 修改 `src/types/index.ts` 中的 `FilterState` 接口，然后更新 `FilterBar` 组件

**Q: 如何修改KPI指标？**
A: 编辑 `src/services/dataAdapter.ts` 中的 `calculateMetrics()` 函数

