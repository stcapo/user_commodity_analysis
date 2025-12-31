import React, { useState, useEffect } from 'react';
import { Row, Col, Table, message, Progress, Statistic } from 'antd';
import { FilterBar } from '../components/common/FilterBar';
import { CompactFilter } from '../components/common/CompactFilter';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { GlassCard } from '../components/cards/GlassCard';
import { ModernCard } from '../components/cards/ModernCard';
import ReactECharts from 'echarts-for-react';
import { useFilters } from '../hooks/useFilters';
import { VersionType, CohortData } from '../types';
import { fetchTransactionData } from '../services/api';
import { applyFilters, getCohortData, getShoppingBehaviorData, ShoppingBehaviorData } from '../services/dataAdapter';
import { formatNumber, formatCurrency } from '../utils/formatters';

interface CohortAnalysisProps {
  version: VersionType;
}

export const CohortAnalysis: React.FC<CohortAnalysisProps> = ({ version }) => {
  const [loading, setLoading] = useState(true);
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [behaviorData, setBehaviorData] = useState<ShoppingBehaviorData | null>(null);
  const { filters, updateDateRange, updateCategories, updatePaymentMethods, updateGender, updateAgeGroups, clearFilters, hasActiveFilters } = useFilters();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const rawData = await fetchTransactionData();
        const filtered = applyFilters(rawData, filters);
        const data = getCohortData(filtered);
        setCohortData(data);
        // V2 专属数据
        const behavior = getShoppingBehaviorData(filtered);
        setBehaviorData(behavior);
      } catch (error) {
        message.error('数据加载失败');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters]);

  if (loading) {
    return <LoadingSkeleton count={4} type="card" />;
  }

  // V1 渲染 - 队列留存分析
  if (version === 'v1') {
    const maxMonths = Math.max(...cohortData.map(c => Math.max(...Object.keys(c.retentionByMonth).map(Number))), 0);
    const columns: any[] = [
      { title: '队列月份', dataIndex: 'cohortMonth', key: 'cohortMonth', width: 120 },
      { title: '队列规模', dataIndex: 'cohortSize', key: 'cohortSize', render: (text: number) => formatNumber(text), width: 100 }
    ];

    for (let i = 0; i <= maxMonths; i++) {
      columns.push({
        title: `M${i}`,
        key: `month_${i}`,
        width: 80,
        render: (_: any, record: CohortData) => {
          const retention = record.retentionByMonth[i];
          if (retention === undefined) return '-';
          return `${retention}%`;
        }
      });
    }

    const tableData = cohortData.map(c => ({ ...c, key: c.cohortMonth }));

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
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <GlassCard>
              <h3 style={{ marginBottom: 16 }}>队列留存分析</h3>
              <div style={{ overflowX: 'auto' }}>
                <Table dataSource={tableData} columns={columns} pagination={false} rowKey="key" size="small" />
              </div>
            </GlassCard>
          </Col>
        </Row>
      </div>
    );
  }

  // V2 渲染 - 购物行为洞察 (完全不同的内容!)
  if (!behaviorData) return null;

  // 购买频次分布图表
  const frequencyChartOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: behaviorData.purchaseFrequency.map(d => d.frequency) },
    yAxis: [
      { type: 'value', name: '客户数', position: 'left' },
      { type: 'value', name: 'GMV', position: 'right' }
    ],
    series: [
      { name: '客户数', type: 'bar', data: behaviorData.purchaseFrequency.map(d => d.count), itemStyle: { color: '#667eea' } },
      { name: 'GMV', type: 'line', yAxisIndex: 1, data: behaviorData.purchaseFrequency.map(d => d.gmv), itemStyle: { color: '#f5576c' } }
    ]
  };

  // 星期分布图表
  const weekdayChartOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: behaviorData.weekdayAnalysis.map(d => d.day) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '订单数',
        type: 'bar',
        data: behaviorData.weekdayAnalysis.map(d => d.orderCount),
        itemStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#667eea' }, { offset: 1, color: '#764ba2' }] }
        },
        barWidth: '60%'
      }
    ]
  };

  // 支付方式环形图
  const paymentChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['50%', '70%'],
      avoidLabelOverlap: false,
      label: { show: false },
      data: behaviorData.paymentPreference.map(d => ({ name: d.method, value: d.count })),
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      }
    }],
    color: ['#667eea', '#f5576c', '#43e97b', '#fa709a', '#4facfe']
  };

  // 月度趋势
  const monthlyChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['活跃客户', '订单数'] },
    xAxis: { type: 'category', data: behaviorData.monthlyTrend.map(d => d.month) },
    yAxis: { type: 'value' },
    series: [
      { name: '活跃客户', type: 'line', smooth: true, data: behaviorData.monthlyTrend.map(d => d.customers), areaStyle: { color: 'rgba(102, 126, 234, 0.2)' }, itemStyle: { color: '#667eea' } },
      { name: '订单数', type: 'line', smooth: true, data: behaviorData.monthlyTrend.map(d => d.orders), itemStyle: { color: '#43e97b' } }
    ]
  };

  const topCustomerColumns = [
    { title: '排名', key: 'rank', render: (_: any, __: any, index: number) => <span style={{ fontWeight: 600, color: index < 3 ? '#667eea' : undefined }}>{index + 1}</span> },
    { title: '客户ID', dataIndex: 'customerId', key: 'customerId' },
    { title: '总消费', dataIndex: 'totalGmv', key: 'totalGmv', render: (v: number) => formatCurrency(v) },
    { title: '订单数', dataIndex: 'orderCount', key: 'orderCount' },
    { title: '客单价', dataIndex: 'avgOrder', key: 'avgOrder', render: (v: number) => formatCurrency(v) }
  ];

  const categoryColumns = [
    { title: '品类', dataIndex: 'category', key: 'category' },
    { title: '客户数', dataIndex: 'customerCount', key: 'customerCount', render: (v: number) => formatNumber(v) },
    { title: '人均消费', dataIndex: 'avgGmv', key: 'avgGmv', render: (v: number) => formatCurrency(v) }
  ];

  return (
    <div>
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

      {/* V2 标题区 */}
      <div style={{ marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, color: '#fff' }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>🛍️ 购物行为洞察</h2>
        <p style={{ margin: '8px 0 0', opacity: 0.9 }}>深入分析客户购买模式、消费习惯与品类偏好</p>
      </div>

      {/* 核心指标行 */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <ModernCard title="购买频次分布" icon="📊" accentColor="#667eea">
            <ReactECharts option={frequencyChartOption} style={{ height: 280 }} />
          </ModernCard>
        </Col>
        <Col xs={24} lg={8}>
          <ModernCard title="每周购物规律" icon="📅" accentColor="#43e97b">
            <ReactECharts option={weekdayChartOption} style={{ height: 280 }} />
          </ModernCard>
        </Col>
        <Col xs={24} lg={8}>
          <ModernCard title="支付偏好" icon="💳" accentColor="#fa709a">
            <ReactECharts option={paymentChartOption} style={{ height: 280 }} />
          </ModernCard>
        </Col>
      </Row>

      {/* 客户与品类分析 */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <ModernCard title="VIP客户榜单 TOP10" icon="👑" accentColor="#f5576c">
            <Table
              dataSource={behaviorData.topCustomers}
              columns={topCustomerColumns}
              pagination={false}
              rowKey="customerId"
              size="small"
            />
          </ModernCard>
        </Col>
        <Col xs={24} lg={12}>
          <ModernCard title="品类吸引力分析" icon="🏷️" accentColor="#4facfe">
            <Table
              dataSource={behaviorData.categoryPreference}
              columns={categoryColumns}
              pagination={false}
              rowKey="category"
              size="small"
            />
          </ModernCard>
        </Col>
      </Row>

      {/* 月度趋势 */}
      <Row gutter={[20, 20]}>
        <Col xs={24}>
          <ModernCard title="月度活跃度趋势" icon="📈" accentColor="#a18cd1">
            <ReactECharts option={monthlyChartOption} style={{ height: 300 }} />
          </ModernCard>
        </Col>
      </Row>
    </div>
  );
};
