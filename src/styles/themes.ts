import { ThemeConfig } from 'antd';

export const themeV1: ThemeConfig = {
  token: {
    colorPrimary: '#00D9FF',
    colorBgBase: '#0a0e27',
    colorTextBase: '#ffffff',
    colorBorder: 'rgba(0, 217, 255, 0.2)',
    borderRadius: 12,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    colorBgContainer: 'rgba(15, 23, 42, 0.8)',
    colorBgElevated: 'rgba(30, 41, 59, 0.9)',
    colorBgLayout: '#0a0e27',
    colorError: '#FF006E',
    colorWarning: '#FFB700',
    colorSuccess: '#00FF88',
    colorInfo: '#00D9FF',
    boxShadow: '0 8px 32px rgba(0, 217, 255, 0.1)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.3)'
  },
  components: {
    Layout: {
      colorBgHeader: 'rgba(15, 23, 42, 0.95)',
      colorBgBody: '#0a0e27',
      colorBgTrigger: 'rgba(0, 217, 255, 0.1)'
    },
    Card: {
      colorBgContainer: 'rgba(30, 41, 59, 0.6)',
      boxShadow: '0 8px 32px rgba(0, 217, 255, 0.08)',
      borderRadiusLG: 12
    },
    Button: {
      colorPrimaryBg: 'rgba(0, 217, 255, 0.1)',
      colorPrimaryBorder: 'rgba(0, 217, 255, 0.3)',
      colorPrimaryHover: 'rgba(0, 217, 255, 0.2)'
    },
    Input: {
      colorBgContainer: 'rgba(30, 41, 59, 0.8)',
      colorBorder: 'rgba(0, 217, 255, 0.2)',
      colorTextPlaceholder: 'rgba(255, 255, 255, 0.45)'
    },
    Select: {
      colorBgContainer: 'rgba(30, 41, 59, 0.8)',
      colorBorder: 'rgba(0, 217, 255, 0.2)'
    },
    DatePicker: {
      colorBgContainer: 'rgba(30, 41, 59, 0.8)',
      colorBorder: 'rgba(0, 217, 255, 0.2)'
    }
  }
};

export const themeV2: ThemeConfig = {
  token: {
    colorPrimary: '#1890FF',
    colorBgBase: '#ffffff',
    colorTextBase: '#000000',
    colorBorder: '#d9d9d9',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    colorBgContainer: '#fafafa',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorError: '#ff4d4f',
    colorWarning: '#faad14',
    colorSuccess: '#52c41a',
    colorInfo: '#1890ff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    boxShadowSecondary: '0 1px 4px rgba(0, 0, 0, 0.06)'
  },
  components: {
    Layout: {
      colorBgHeader: '#ffffff',
      colorBgBody: '#f5f5f5',
      colorBgTrigger: '#f0f0f0'
    },
    Card: {
      colorBgContainer: '#ffffff',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      borderRadiusLG: 8
    },
    Button: {
      colorPrimaryBg: '#e6f7ff',
      colorPrimaryBorder: '#91d5ff',
      colorPrimaryHover: '#40a9ff'
    },
    Input: {
      colorBgContainer: '#ffffff',
      colorBorder: '#d9d9d9',
      colorTextPlaceholder: 'rgba(0, 0, 0, 0.45)'
    },
    Select: {
      colorBgContainer: '#ffffff',
      colorBorder: '#d9d9d9'
    },
    DatePicker: {
      colorBgContainer: '#ffffff',
      colorBorder: '#d9d9d9'
    }
  }
};

