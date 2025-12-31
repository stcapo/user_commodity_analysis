import React from 'react';
import { Card, CardProps } from 'antd';

interface PaperCardProps extends CardProps {
  children: React.ReactNode;
}

export const PaperCard: React.FC<PaperCardProps> = ({ children, ...props }) => {
  return (
    <Card
      {...props}
      style={{
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: '1px solid #f0f0f0',
        ...props.style
      }}
      bordered={false}
    >
      {children}
    </Card>
  );
};

