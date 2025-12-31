import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';

export const SideNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = NAV_ITEMS.find(item => item.path === location.pathname)?.key || 'dashboard';

  const handleMenuClick = (key: string) => {
    const item = NAV_ITEMS.find(item => item.key === key);
    if (item) {
      navigate(item.path);
    }
  };

  return (
    <Layout.Sider
      width={200}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 64,
        bottom: 0
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={(e) => handleMenuClick(e.key)}
        items={NAV_ITEMS.map(item => ({
          key: item.key,
          label: item.label
        }))}
      />
    </Layout.Sider>
  );
};

