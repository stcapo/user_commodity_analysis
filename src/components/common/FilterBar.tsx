import React from 'react';
import { Card, Row, Col, DatePicker, Select, Radio, Checkbox, Button, Space, Badge } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { FilterState } from '../../types';
import { CATEGORIES, PAYMENT_METHODS, AGE_GROUPS } from '../../constants';

interface FilterBarProps {
  filters: FilterState;
  onDateRangeChange: (dates: [string, string] | null) => void;
  onCategoriesChange: (categories: string[]) => void;
  onPaymentMethodsChange: (methods: string[]) => void;
  onGenderChange: (gender: 'All' | 'Male' | 'Female') => void;
  onAgeGroupsChange: (groups: string[]) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onDateRangeChange,
  onCategoriesChange,
  onPaymentMethodsChange,
  onGenderChange,
  onAgeGroupsChange,
  onClearFilters,
  hasActiveFilters
}) => {
  const handleDateChange = (dates: any) => {
    if (dates) {
      const [start, end] = dates;
      onDateRangeChange([start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]);
    } else {
      onDateRangeChange(null);
    }
  };

  const dateRangeValue: [any, any] | null = filters.dateRange
    ? [dayjs(filters.dateRange[0]), dayjs(filters.dateRange[1])]
    : null;

  const activeFilterCount = [
    filters.dateRange ? 1 : 0,
    filters.categories.length,
    filters.paymentMethods.length,
    filters.gender !== 'All' ? 1 : 0,
    filters.ageGroups.length
  ].reduce((a, b) => a + b, 0);

  return (
    <Card style={{ marginBottom: 24 }} bordered={false}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, marginBottom: 8, fontWeight: 500 }}>日期范围</div>
            <DatePicker.RangePicker
              value={dateRangeValue}
              onChange={handleDateChange}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, marginBottom: 8, fontWeight: 500 }}>商品类别</div>
            <Select
              mode="multiple"
              placeholder="选择类别"
              value={filters.categories}
              onChange={onCategoriesChange}
              options={CATEGORIES.map(cat => ({ label: cat, value: cat }))}
              style={{ width: '100%' }}
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, marginBottom: 8, fontWeight: 500 }}>支付方式</div>
            <Select
              mode="multiple"
              placeholder="选择支付方式"
              value={filters.paymentMethods}
              onChange={onPaymentMethodsChange}
              options={PAYMENT_METHODS.map(method => ({ label: method, value: method }))}
              style={{ width: '100%' }}
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, marginBottom: 8, fontWeight: 500 }}>性别</div>
            <Radio.Group value={filters.gender} onChange={(e) => onGenderChange(e.target.value)}>
              <Radio value="All">全部</Radio>
              <Radio value="Male">男</Radio>
              <Radio value="Female">女</Radio>
            </Radio.Group>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={18}>
            <div style={{ fontSize: 12, marginBottom: 8, fontWeight: 500 }}>年龄段</div>
            <Checkbox.Group
              value={filters.ageGroups}
              onChange={onAgeGroupsChange}
              options={AGE_GROUPS.map(group => ({ label: group, value: group }))}
            />
          </Col>

          <Col xs={24} md={6} style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button
              icon={<ClearOutlined />}
              onClick={onClearFilters}
              block
              danger={hasActiveFilters}
            >
              <Badge count={activeFilterCount} style={{ backgroundColor: '#ff4d4f' }}>
                清空筛选
              </Badge>
            </Button>
          </Col>
        </Row>
      </Space>
    </Card>
  );
};

