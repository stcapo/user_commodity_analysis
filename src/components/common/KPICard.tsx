import React from 'react';
import { Card, Row, Col } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { KPIData, VersionType } from '../../types';

interface KPICardProps {
  data: KPIData;
  version: VersionType;
}

export const KPICard: React.FC<KPICardProps> = ({ data, version }) => {
  const isV1 = version === 'v1';
  const cardStyle = isV1
    ? {
        background: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 217, 255, 0.2)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0, 217, 255, 0.08)'
      }
    : {
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: '1px solid #f0f0f0'
      };

  const trendColor = typeof data.trend === 'number' && data.trend > 0 ? '#00FF88' : '#FF006E';

  return (
    <Card style={cardStyle} bordered={false}>
      <Row gutter={16} align="middle">
        <Col flex="auto">
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
            {data.label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
            {data.value}
            {data.unit && <span style={{ fontSize: 14, marginLeft: 4 }}>{data.unit}</span>}
          </div>
          {data.trend !== undefined && (
            <div style={{ fontSize: 12, color: trendColor }}>
              {data.trend > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {' '}
              {Math.abs(data.trend).toFixed(2)}%
              {data.trendLabel && ` ${data.trendLabel}`}
            </div>
          )}
        </Col>
      </Row>
    </Card>
  );
};

