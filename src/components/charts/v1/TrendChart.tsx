import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ChartDataPoint } from '../../../types';
import { CHART_COLORS_V1 } from '../../../constants';

interface TrendChartProps {
  data: ChartDataPoint[];
  title?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, title = 'GMV与订单双轴趋势' }) => {
  const option = useMemo(() => ({
    title: {
      text: title,
      textStyle: { color: '#ffffff', fontSize: 14, fontWeight: 600 }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderColor: 'rgba(0, 217, 255, 0.3)',
      textStyle: { color: '#ffffff' }
    },
    legend: {
      data: ['GMV', '订单数'],
      textStyle: { color: '#ffffff' }
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
      axisLine: { lineStyle: { color: 'rgba(0, 217, 255, 0.2)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.7)' }
    },
    yAxis: [
      {
        type: 'value',
        name: 'GMV (¥)',
        axisLine: { lineStyle: { color: 'rgba(0, 217, 255, 0.2)' } },
        axisLabel: { color: 'rgba(255, 255, 255, 0.7)' },
        splitLine: { lineStyle: { color: 'rgba(0, 217, 255, 0.1)' } }
      },
      {
        type: 'value',
        name: '订单数',
        axisLine: { lineStyle: { color: 'rgba(0, 217, 255, 0.2)' } },
        axisLabel: { color: 'rgba(255, 255, 255, 0.7)' },
        splitLine: { lineStyle: { color: 'rgba(0, 217, 255, 0.1)' } }
      }
    ],
    series: [
      {
        name: 'GMV',
        type: 'line',
        data: data.map(d => d.value),
        smooth: true,
        itemStyle: { color: CHART_COLORS_V1[0] },
        areaStyle: { color: `rgba(0, 217, 255, 0.2)` },
        yAxisIndex: 0
      },
      {
        name: '订单数',
        type: 'bar',
        data: data.map(d => (d as any).orderCount || 0),
        itemStyle: { color: CHART_COLORS_V1[1] },
        yAxisIndex: 1
      }
    ]
  }), [data, title]);

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

