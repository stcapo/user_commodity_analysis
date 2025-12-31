import React from 'react';
import { Layout, Menu, Button, Space, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { VersionType } from '../types';
import { useExport } from '../hooks/useExport';

const NAV_ITEMS_V2 = [
    { key: 'dashboard', label: '📊 总览大盘', path: '/' },
    { key: 'users', label: '👥 用户画像', path: '/users' },
    { key: 'category', label: '📦 品类洞察', path: '/category' },
    { key: 'cohort', label: '🔄 复购分析', path: '/cohort' }
];

interface TopNavLayoutProps {
    version: VersionType;
    onVersionChange: (version: VersionType) => void;
    children: React.ReactNode;
}

export const TopNavLayout: React.FC<TopNavLayoutProps> = ({ version, onVersionChange, children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isExporting, error, exportPage, clearError } = useExport();

    const selectedKey = NAV_ITEMS_V2.find(item => item.path === location.pathname)?.key || 'dashboard';

    const handleMenuClick = (e: { key: string }) => {
        const item = NAV_ITEMS_V2.find(item => item.key === e.key);
        if (item) {
            navigate(item.path);
        }
    };

    const handleExport = async () => {
        await exportPage('root');
        if (!error) {
            message.success('页面已导出');
        } else {
            message.error(error);
            clearError();
        }
    };

    return (
        <Layout style={{ minHeight: '100vh' }} className="theme-v2">
            {/* 顶部导航栏 */}
            <Layout.Header
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 32px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.25)',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    height: 64
                }}
            >
                {/* Logo 区域 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20
                    }}>
                        📈
                    </div>
                    <span style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#fff',
                        letterSpacing: 1
                    }}>
                        基于用户行为驱动的电商数据分析系统
                    </span>
                </div>

                {/* 导航菜单 */}
                <Menu
                    mode="horizontal"
                    selectedKeys={[selectedKey]}
                    onClick={handleMenuClick}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        flex: 1,
                        justifyContent: 'center'
                    }}
                    items={NAV_ITEMS_V2.map(item => ({
                        key: item.key,
                        label: (
                            <span style={{
                                color: '#fff',
                                fontWeight: 500,
                                padding: '0 8px'
                            }}>
                                {item.label}
                            </span>
                        )
                    }))}
                />

                {/* 右侧操作区 */}
                <Space size="middle">
                    {/* v1/v2 版本切换按钮已隐藏，默认显示v1版本 */}
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleExport}
                        loading={isExporting}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: 8
                        }}
                    >
                        导出
                    </Button>
                </Space>
            </Layout.Header>

            {/* 内容区域 - 全宽显示 */}
            <Layout.Content
                style={{
                    marginTop: 64,
                    padding: 32,
                    minHeight: 'calc(100vh - 64px)',
                    background: 'linear-gradient(180deg, #f8f9fe 0%, #eef1f8 100%)'
                }}
            >
                <div style={{ maxWidth: 1600, margin: '0 auto' }}>
                    {children}
                </div>
            </Layout.Content>
        </Layout>
    );
};
