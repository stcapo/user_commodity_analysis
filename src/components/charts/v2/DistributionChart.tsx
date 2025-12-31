import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CHART_COLORS_V2 } from '../../../constants';

interface DistributionChartProps {
  data: Array<{ range: string; count: number }>;
  title?: string;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({ 
  data, 
  title = '订单金额分布'
}) => {
  const option = useMemo(() => ({
    title: {
      text: title,
      textStyle: { color: '#000000', fontSize: 14, fontWeight: 600 }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#d9d9d9',
      textStyle: { color: '#000000' },
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.range),
      axisLine: { lineStyle: { color: '#d9d9d9' } },
      axisLabel: { color: '#666666' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#d9d9d9' } },
      axisLabel: { color: '#666666' },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series: [
      {
        name: '订单数',
        type: 'bar',
        data: data.map(d => d.count),
        itemStyle: {
          color: CHART_COLORS_V2[0],
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          color: '#000000'
        }
      }
    ]
  }), [data, title]);

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

