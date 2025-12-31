import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CHART_COLORS_V2 } from '../../../constants';

interface StackedAreaChartProps {
  data: Array<{ date: string;[key: string]: any }>;
  title?: string;
  seriesNames?: string[];
}

export const StackedAreaChart: React.FC<StackedAreaChartProps> = ({
  data,
  title = '新老用户堆叠面积图',
  seriesNames = ['新用户', '老用户']
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
      type: 'line',
      stack: 'total',
      data: data.map(d => d[name === '新用户' ? 'new' : 'returning'] || 0),
      smooth: true,
      itemStyle: { color: CHART_COLORS_V2[index] },
      areaStyle: { color: `rgba(${index === 0 ? '24, 144, 255' : '82, 196, 26'}, 0.3)` },
      emphasis: {
        focus: 'series'
      }
    }))
  }), [data, title, seriesNames]);

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

