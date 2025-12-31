import React, { useState, useEffect } from 'react';
import { Row, Col, message } from 'antd';
import { FilterBar } from '../components/common/FilterBar';
import { CompactFilter } from '../components/common/CompactFilter';
import { KPICard } from '../components/common/KPICard';
import { MetricTile } from '../components/common/MetricTile';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { GlassCard } from '../components/cards/GlassCard';
import { ModernCard } from '../components/cards/ModernCard';
import { TrendChart } from '../components/charts/v1/TrendChart';
import { CategoryDonutChart } from '../components/charts/v1/CategoryDonutChart';
import { CategoryBarChart } from '../components/charts/v1/CategoryBarChart';
import { HeatmapChart } from '../components/charts/v1/HeatmapChart';
import { CalendarHeatmap } from '../components/charts/v1/CalendarHeatmap';
import { HistogramChart } from '../components/charts/v1/HistogramChart';
import { AreaChart } from '../components/charts/v2/AreaChart';
import { StackedAreaChart } from '../components/charts/v2/StackedAreaChart';
import { DistributionChart } from '../components/charts/v2/DistributionChart';
import { StackedBarChart } from '../components/charts/v2/StackedBarChart';
import { ParetoChart } from '../components/charts/v2/ParetoChart';
import { GrowthRankChart } from '../components/charts/v2/GrowthRankChart';
import { useFilters } from '../hooks/useFilters';
import { VersionType, DashboardData } from '../types';
import { fetchTransactionData } from '../services/api';
import { applyFilters, getDashboardData } from '../services/dataAdapter';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface DashboardProps {
  version: VersionType;
}

export const Dashboard: React.FC<DashboardProps> = ({ version }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const { filters, updateDateRange, updateCategories, updatePaymentMethods, updateGender, updateAgeGroups, clearFilters, hasActiveFilters } = useFilters();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const rawData = await fetchTransactionData();
        const filtered = applyFilters(rawData, filters);
        const data = getDashboardData(filtered, version);
        setDashboardData(data);
      } catch (error) {
        message.error('数据加载失败');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters, version]);


  if (loading || !dashboardData) {
    return <LoadingSkeleton count={4} type="card" />;
  }

  const kpiIcons = ['💰', '📦', '👤', '🛒', '📊', '🔄'];
  const kpiGradients = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a18cd1', '#fbc2eb']
  ];

  const kpiData = [
    { label: 'GMV', value: formatCurrency(dashboardData.kpis.gmv), trend: 12.5 },
    { label: '订单数', value: formatNumber(dashboardData.kpis.orderCount), trend: 8.2 },
    { label: '买家数', value: formatNumber(dashboardData.kpis.uniqueBuyers), trend: -2.1 },
    { label: '客单价', value: formatCurrency(dashboardData.kpis.aov), trend: 5.8 },
    { label: '件单价', value: formatCurrency(dashboardData.kpis.ipv), trend: 3.4 },
    { label: '复购率', value: `${dashboardData.kpis.repurchaseRate}%`, trend: 1.2 }
  ];

  // V1 渲染 - 侧边栏布局 + 玻璃态卡片
  if (version === 'v1') {
    return (
      <div>
        <FilterBar
          filters={filters}
          onDateRangeChange={updateDateRange}
          onCategoriesChange={updateCategories}
          onPaymentMethodsChange={updatePaymentMethods}
          onGenderChange={updateGender}
          onAgeGroupsChange={updateAgeGroups}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters()}
        />

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {kpiData.map((kpi, index) => (
            <Col xs={24} sm={12} md={8} lg={4} key={index}>
              <KPICard data={kpi} version={version} />
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <GlassCard>
              <TrendChart data={dashboardData.trendData} />
            </GlassCard>
          </Col>
          <Col xs={24} lg={12}>
            <GlassCard>
              <CategoryDonutChart data={dashboardData.categoryData} />
            </GlassCard>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <GlassCard>
              <CategoryBarChart data={dashboardData.categoryData} />
            </GlassCard>
          </Col>
          <Col xs={24} lg={12}>
            <GlassCard>
              <HeatmapChart data={dashboardData.paymentMethodData} xAxisKey="category" yAxisKey="payment" />
            </GlassCard>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <GlassCard>
              <CalendarHeatmap data={dashboardData.calendarData} />
            </GlassCard>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <GlassCard>
              <HistogramChart data={dashboardData.ageDistribution} />
            </GlassCard>
          </Col>
        </Row>
      </div>
    );
  }

  // V2 渲染 - 顶部导航 + 现代卡片 + 全新布局
  return (
    <div>
      {/* V2 紧凑筛选栏 */}
      <CompactFilter
        filters={filters}
        onDateRangeChange={updateDateRange}
        onCategoriesChange={updateCategories}
        onPaymentMethodsChange={updatePaymentMethods}
        onGenderChange={updateGender}
        onAgeGroupsChange={updateAgeGroups}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters()}
      />

      {/* V2 指标瓷片 - 3列布局 */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        {kpiData.map((kpi, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <MetricTile
              data={kpi}
              icon={kpiIcons[index]}
              gradientFrom={kpiGradients[index][0]}
              gradientTo={kpiGradients[index][1]}
            />
          </Col>
        ))}
      </Row>

      {/* V2 图表区 - 3列布局 */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <ModernCard title="GMV趋势" icon="📈" accentColor="#667eea">
            <AreaChart data={dashboardData.trendData} />
          </ModernCard>
        </Col>
        <Col xs={24} lg={8}>
          <ModernCard title="新老用户" icon="👥" accentColor="#f5576c">
            <StackedAreaChart data={dashboardData.userNewVsReturning} />
          </ModernCard>
        </Col>
        <Col xs={24} lg={8}>
          <ModernCard title="订单分布" icon="📊" accentColor="#43e97b">
            <DistributionChart data={dashboardData.orderValueDistribution} />
          </ModernCard>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={8}>
          <ModernCard title="支付方式趋势" icon="💳" accentColor="#4facfe">
            <StackedBarChart data={dashboardData.userNewVsReturning} seriesNames={['new', 'returning']} />
          </ModernCard>
        </Col>
        <Col xs={24} lg={8}>
          <ModernCard title="用户价值分布" icon="🎯" accentColor="#fa709a">
            <ParetoChart data={dashboardData.userGmvPareto} />
          </ModernCard>
        </Col>
        <Col xs={24} lg={8}>
          <ModernCard title="品类增长排行" icon="🚀" accentColor="#a18cd1">
            <GrowthRankChart data={dashboardData.categoryGrowth} />
          </ModernCard>
        </Col>
      </Row>
    </div>
  );
};


