import React from 'react';
import { Card, CardProps } from 'antd';

interface GlassCardProps extends CardProps {
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, ...props }) => {
  return (
    <Card
      {...props}
      style={{
        background: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 217, 255, 0.2)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0, 217, 255, 0.08)',
        ...props.style
      }}
      bordered={false}
    >
      {children}
    </Card>
  );
};

