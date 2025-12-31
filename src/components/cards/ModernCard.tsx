import React from 'react';
import { Card, CardProps } from 'antd';

interface ModernCardProps extends CardProps {
    children: React.ReactNode;
    accentColor?: string;
    icon?: React.ReactNode;
}

export const ModernCard: React.FC<ModernCardProps> = ({
    children,
    title,
    accentColor = '#667eea',
    icon,
    ...props
}) => {
    return (
        <Card
            {...props}
            style={{
                background: '#ffffff',
                borderRadius: 16,
                boxShadow: '0 4px 24px rgba(102, 126, 234, 0.08)',
                border: 'none',
                overflow: 'hidden',
                position: 'relative',
                ...props.style
            }}
            bordered={false}
            bodyStyle={{ padding: 0 }}
        >
            {/* 左侧渐变色条 */}
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}88 100%)`,
                    borderRadius: '16px 0 0 16px'
                }}
            />

            {/* 标题栏 */}
            {title && (
                <div
                    style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: 'linear-gradient(180deg, #fafbff 0%, #ffffff 100%)'
                    }}
                >
                    {icon && (
                        <span style={{ fontSize: 18 }}>{icon}</span>
                    )}
                    <span style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#1a1a2e',
                        letterSpacing: 0.3
                    }}>
                        {title}
                    </span>
                </div>
            )}

            {/* 内容区 */}
            <div style={{ padding: title ? '20px 24px' : '24px' }}>
                {children}
            </div>
        </Card>
    );
};
