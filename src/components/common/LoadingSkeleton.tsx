import React from 'react';
import { Skeleton, Row, Col, Card } from 'antd';

interface LoadingSkeletonProps {
  count?: number;
  type?: 'card' | 'chart' | 'table';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ count = 1, type = 'card' }) => {
  if (type === 'chart') {
    return (
      <Card style={{ marginBottom: 24 }} bordered={false}>
        <Skeleton
          active
          paragraph={{ rows: 8 }}
          style={{ height: 400 }}
        />
      </Card>
    );
  }

  if (type === 'table') {
    return (
      <Card style={{ marginBottom: 24 }} bordered={false}>
        <Skeleton
          active
          paragraph={{ rows: 10 }}
        />
      </Card>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: count }).map((_, i) => (
        <Col xs={24} sm={12} md={6} key={i}>
          <Card style={{ marginBottom: 16 }} bordered={false}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

