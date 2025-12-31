import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ChartDataPoint } from '../../../types';
import { CHART_COLORS_V2 } from '../../../constants';

interface AreaChartProps {
  data: ChartDataPoint[];
  title?: string;
}

export const AreaChart: React.FC<AreaChartProps> = ({ data, title = 'GMV增长面积图' }) => {
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
      data: ['GMV'],
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
      name: 'GMV (¥)',
      axisLine: { lineStyle: { color: '#d9d9d9' } },
      axisLabel: { color: '#666666' },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series: [
      {
        name: 'GMV',
        type: 'line',
        data: data.map(d => d.value),
        smooth: true,
        itemStyle: { color: CHART_COLORS_V2[0] },
        areaStyle: { color: `rgba(24, 144, 255, 0.2)` },
        emphasis: {
          focus: 'series'
        }
      }
    ]
  }), [data, title]);

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

