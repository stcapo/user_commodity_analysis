import React, { useState } from 'react';
import { Input, Select, DatePicker, Button, Dropdown, Space, Badge, Tag } from 'antd';
import { FilterOutlined, ClearOutlined, DownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { FilterState } from '../../types';
import { CATEGORIES, PAYMENT_METHODS, AGE_GROUPS } from '../../constants';

interface CompactFilterProps {
    filters: FilterState;
    onDateRangeChange: (dates: [string, string] | null) => void;
    onCategoriesChange: (categories: string[]) => void;
    onPaymentMethodsChange: (methods: string[]) => void;
    onGenderChange: (gender: 'All' | 'Male' | 'Female') => void;
    onAgeGroupsChange: (groups: string[]) => void;
    onClearFilters: () => void;
    hasActiveFilters: boolean;
}

export const CompactFilter: React.FC<CompactFilterProps> = ({
    filters,
    onDateRangeChange,
    onCategoriesChange,
    onPaymentMethodsChange,
    onGenderChange,
    onAgeGroupsChange,
    onClearFilters,
    hasActiveFilters
}) => {
    const [expanded, setExpanded] = useState(false);

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

    const filterContent = (
        <div
            style={{
                padding: 20,
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                width: 400
            }}
        >
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>商品类别</div>
                <Select
                    mode="multiple"
                    placeholder="选择类别"
                    value={filters.categories}
                    onChange={onCategoriesChange}
                    options={CATEGORIES.map(cat => ({ label: cat, value: cat }))}
                    style={{ width: '100%' }}
                    maxTagCount={2}
                />
            </div>

            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>支付方式</div>
                <Select
                    mode="multiple"
                    placeholder="选择支付方式"
                    value={filters.paymentMethods}
                    onChange={onPaymentMethodsChange}
                    options={PAYMENT_METHODS.map(m => ({ label: m, value: m }))}
                    style={{ width: '100%' }}
                />
            </div>

            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>性别</div>
                <Select
                    value={filters.gender}
                    onChange={onGenderChange}
                    options={[
                        { label: '全部', value: 'All' },
                        { label: '男', value: 'Male' },
                        { label: '女', value: 'Female' }
                    ]}
                    style={{ width: '100%' }}
                />
            </div>

            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>年龄段</div>
                <Select
                    mode="multiple"
                    placeholder="选择年龄段"
                    value={filters.ageGroups}
                    onChange={onAgeGroupsChange}
                    options={AGE_GROUPS.map(g => ({ label: g, value: g }))}
                    style={{ width: '100%' }}
                    maxTagCount={2}
                />
            </div>
        </div>
    );

    return (
        <div
            style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: '16px 24px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 2px 12px rgba(102, 126, 234, 0.06)',
                flexWrap: 'wrap'
            }}
        >
            {/* 日期范围 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>📅</span>
                <DatePicker.RangePicker
                    value={dateRangeValue}
                    onChange={handleDateChange}
                    format="YYYY-MM-DD"
                    style={{ borderRadius: 8 }}
                    placeholder={['开始日期', '结束日期']}
                />
            </div>

            {/* 更多筛选 */}
            <Dropdown
                dropdownRender={() => filterContent}
                trigger={['click']}
                open={expanded}
                onOpenChange={setExpanded}
            >
                <Button
                    icon={<FilterOutlined />}
                    style={{
                        borderRadius: 8,
                        borderColor: hasActiveFilters ? '#667eea' : undefined,
                        color: hasActiveFilters ? '#667eea' : undefined
                    }}
                >
                    更多筛选
                    {activeFilterCount > 0 && (
                        <Badge
                            count={activeFilterCount}
                            style={{
                                marginLeft: 8,
                                backgroundColor: '#667eea'
                            }}
                        />
                    )}
                    <DownOutlined style={{ marginLeft: 4, fontSize: 10 }} />
                </Button>
            </Dropdown>

            {/* 已选筛选标签 */}
            <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                {filters.categories.map(cat => (
                    <Tag
                        key={cat}
                        closable
                        onClose={() => onCategoriesChange(filters.categories.filter(c => c !== cat))}
                        style={{ borderRadius: 12, padding: '2px 10px' }}
                    >
                        {cat}
                    </Tag>
                ))}
                {filters.gender !== 'All' && (
                    <Tag
                        closable
                        onClose={() => onGenderChange('All')}
                        style={{ borderRadius: 12, padding: '2px 10px' }}
                    >
                        {filters.gender === 'Male' ? '男' : '女'}
                    </Tag>
                )}
            </div>

            {/* 清空按钮 */}
            {hasActiveFilters && (
                <Button
                    icon={<ClearOutlined />}
                    onClick={onClearFilters}
                    danger
                    type="text"
                    style={{ borderRadius: 8 }}
                >
                    清空
                </Button>
            )}
        </div>
    );
};
