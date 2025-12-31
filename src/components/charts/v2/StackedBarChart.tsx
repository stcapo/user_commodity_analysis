import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CHART_COLORS_V2 } from '../../../constants';

interface StackedBarChartProps {
  data: Array<{ date: string; [key: string]: any }>;
  title?: string;
  seriesNames?: string[];
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({ 
  data, 
  title = '支付方式占比趋势',
  seriesNames = ['信用卡', '数字钱包', '现金']
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
      textStyle: { color: '#000000' }
    },
    legend: {
      data: seriesNames,
      textStyle: { color: '#000000' }
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
      data: data.map(d => d.date),
      axisLine: { lineStyle: { color: '#d9d9d9' } },
      axisLabel: { color: '#666666' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#d9d9d9' } },
      axisLabel: { color: '#666666' },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series: seriesNames.map((name, index) => ({
      name,
      type: 'bar',
      stack: 'total',
      data: data.map(d => d[name] || 0),
      itemStyle: { color: CHART_COLORS_V2[index] },
      emphasis: {
        focus: 'series'
      }
    }))
  }), [data, title, seriesNames]);

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

