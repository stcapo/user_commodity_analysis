import React from 'react';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { KPIData } from '../../types';

interface MetricTileProps {
    data: KPIData;
    gradientFrom?: string;
    gradientTo?: string;
    icon?: React.ReactNode;
}

export const MetricTile: React.FC<MetricTileProps> = ({
    data,
    gradientFrom = '#667eea',
    gradientTo = '#764ba2',
    icon
}) => {
    const isPositive = typeof data.trend === 'number' && data.trend > 0;
    const trendColor = isPositive ? '#10b981' : '#ef4444';

    return (
        <div
            style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 2px 12px rgba(102, 126, 234, 0.08)',
                transition: 'all 0.3s ease',
                cursor: 'default'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.15)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(102, 126, 234, 0.08)';
            }}
        >
            {/* 图标区 */}
            <div
                style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0
                }}
            >
                {icon || '📊'}
            </div>

            {/* 数据区 */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: 12,
                    color: '#6b7280',
                    marginBottom: 4,
                    fontWeight: 500
                }}>
                    {data.label}
                </div>
                <div style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#1a1a2e',
                    lineHeight: 1.2
                }}>
                    {data.value}
                    {data.unit && (
                        <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 4, color: '#6b7280' }}>
                            {data.unit}
                        </span>
                    )}
                </div>
            </div>

            {/* 趋势区 */}
            {data.trend !== undefined && (
                <div
                    style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        background: isPositive ? '#ecfdf5' : '#fef2f2',
                        color: trendColor,
                        fontSize: 13,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                    }}
                >
                    {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {Math.abs(data.trend).toFixed(1)}%
                </div>
            )}
        </div>
    );
};
