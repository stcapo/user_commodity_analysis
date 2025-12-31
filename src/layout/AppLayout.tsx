import React from 'react';
import { Layout, ConfigProvider } from 'antd';
import { TopBar } from './TopBar';
import { SideNav } from './SideNav';
import { TopNavLayout } from './TopNavLayout';
import { VersionType } from '../types';
import { themeV1, themeV2 } from '../styles/themes';

interface AppLayoutProps {
  version: VersionType;
  onVersionChange: (version: VersionType) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ version, onVersionChange, children }) => {
  const theme = version === 'v1' ? themeV1 : themeV2;

  // V2 使用全新的顶部导航布局
  if (version === 'v2') {
    return (
      <ConfigProvider theme={theme}>
        <TopNavLayout version={version} onVersionChange={onVersionChange}>
          {children}
        </TopNavLayout>
      </ConfigProvider>
    );
  }

  // V1 保持原有侧边栏布局
  return (
    <ConfigProvider theme={theme}>
      <Layout style={{ minHeight: '100vh' }} className="theme-v1">
        <TopBar version={version} onVersionChange={onVersionChange} />
        <Layout style={{ marginTop: 64 }}>
          <SideNav />
          <Layout.Content
            style={{
              marginLeft: 200,
              padding: 24,
              minHeight: 'calc(100vh - 88px)',
              overflow: 'auto'
            }}
          >
            {children}
          </Layout.Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

