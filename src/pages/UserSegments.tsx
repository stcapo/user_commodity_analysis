import React, { useState, useEffect } from 'react';
import { Row, Col, Table, message } from 'antd';
import { FilterBar } from '../components/common/FilterBar';
import { CompactFilter } from '../components/common/CompactFilter';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { GlassCard } from '../components/cards/GlassCard';
import { ModernCard } from '../components/cards/ModernCard';
import { HeatmapChart } from '../components/charts/v1/HeatmapChart';
import { HistogramChart } from '../components/charts/v1/HistogramChart';
import { useFilters } from '../hooks/useFilters';
import { VersionType, SegmentsData } from '../types';
import { fetchTransactionData } from '../services/api';
import { applyFilters, getUserSegmentsData } from '../services/dataAdapter';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface UserSegmentsProps {
  version: VersionType;
}

export const UserSegments: React.FC<UserSegmentsProps> = ({ version }) => {
  const [loading, setLoading] = useState(true);
  const [segmentsData, setSegmentsData] = useState<SegmentsData | null>(null);
  const { filters, updateDateRange, updateCategories, updatePaymentMethods, updateGender, updateAgeGroups, clearFilters, hasActiveFilters } = useFilters();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const rawData = await fetchTransactionData();
        const filtered = applyFilters(rawData, filters);
        const data = getUserSegmentsData(filtered, version);
        setSegmentsData(data);
      } catch (error) {
        message.error('数据加载失败');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters, version]);

  if (loading || !segmentsData) {
    return <LoadingSkeleton count={4} type="card" />;
  }

  const genderColumns = [
    { title: '性别', dataIndex: 'segment', key: 'segment' },
    { title: '人数', dataIndex: 'count', key: 'count', render: (text: number) => formatNumber(text) },
    { title: '占比', dataIndex: 'percentage', key: 'percentage', render: (text: number) => `${text}%` },
    { title: 'GMV', dataIndex: 'gmv', key: 'gmv', render: (text: number) => formatCurrency(text) }
  ];

  return (
    <div>
      {version === 'v1' ? (
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
      ) : (
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
      )}

      <Row gutter={[version === 'v1' ? 16 : 20, version === 'v1' ? 16 : 20]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          {version === 'v1' ? (
            <GlassCard>
              <h3 style={{ marginBottom: 16 }}>性别分布</h3>
              <Table
                dataSource={segmentsData.genderDistribution}
                columns={genderColumns}
                pagination={false}
                rowKey="segment"
              />
            </GlassCard>
          ) : (
            <ModernCard title="性别分布" icon="👥" accentColor="#667eea">
              <Table
                dataSource={segmentsData.genderDistribution}
                columns={genderColumns}
                pagination={false}
                rowKey="segment"
              />
            </ModernCard>
          )}
        </Col>
      </Row>

      <Row gutter={[version === 'v1' ? 16 : 20, version === 'v1' ? 16 : 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={version === 'v1' ? 12 : 8}>
          {version === 'v1' ? (
            <GlassCard>
              <HistogramChart data={segmentsData.ageDistribution} title="年龄段分布" />
            </GlassCard>
          ) : (
            <ModernCard title="年龄段分布" icon="📊" accentColor="#f5576c">
              <HistogramChart data={segmentsData.ageDistribution} title="" />
            </ModernCard>
          )}
        </Col>
        <Col xs={24} lg={version === 'v1' ? 12 : 8}>
          {version === 'v1' ? (
            <GlassCard>
              <HistogramChart data={segmentsData.paymentMethodDistribution} title="支付方式分布" xAxisLabel="支付方式" />
            </GlassCard>
          ) : (
            <ModernCard title="支付方式分布" icon="💳" accentColor="#43e97b">
              <HistogramChart data={segmentsData.paymentMethodDistribution} title="" xAxisLabel="支付方式" />
            </ModernCard>
          )}
        </Col>
        {version === 'v2' && (
          <Col xs={24} lg={8}>
            <ModernCard title="年龄×支付热力图" icon="🔥" accentColor="#4facfe">
              <HeatmapChart data={segmentsData.agePaymentMatrix} xAxisKey="age" yAxisKey="payment" title="" />
            </ModernCard>
          </Col>
        )}
      </Row>

      {version === 'v1' && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24}>
              <GlassCard>
                <HeatmapChart data={segmentsData.agePaymentMatrix} xAxisKey="age" yAxisKey="payment" title="年龄×支付方式热力图" />
              </GlassCard>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <GlassCard>
                <HeatmapChart data={segmentsData.ageCategoryMatrix} xAxisKey="age" yAxisKey="category" title="年龄×品类热力图" />
              </GlassCard>
            </Col>
          </Row>
        </>
      )}

      {version === 'v2' && (
        <Row gutter={[20, 20]}>
          <Col xs={24}>
            <ModernCard title="年龄×品类热力图" icon="📈" accentColor="#a18cd1">
              <HeatmapChart data={segmentsData.ageCategoryMatrix} xAxisKey="age" yAxisKey="category" title="" />
            </ModernCard>
          </Col>
        </Row>
      )}
    </div>
  );
};


