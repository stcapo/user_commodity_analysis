import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CHART_COLORS_V1 } from '../../../constants';

interface HistogramChartProps {
  data: Array<{ age?: number; count: number; [key: string]: any }>;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export const HistogramChart: React.FC<HistogramChartProps> = ({ 
  data, 
  title = '年龄分布直方图',
  xAxisLabel = '年龄',
  yAxisLabel = '人数'
}) => {
  const option = useMemo(() => ({
    title: {
      text: title,
      textStyle: { color: '#ffffff', fontSize: 14, fontWeight: 600 }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderColor: 'rgba(0, 217, 255, 0.3)',
      textStyle: { color: '#ffffff' },
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
      data: data.map(d => d.age || d.range || d.segment || ''),
      axisLine: { lineStyle: { color: 'rgba(0, 217, 255, 0.2)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.7)' }
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel,
      axisLine: { lineStyle: { color: 'rgba(0, 217, 255, 0.2)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.7)' },
      splitLine: { lineStyle: { color: 'rgba(0, 217, 255, 0.1)' } }
    },
    series: [
      {
        name: yAxisLabel,
        type: 'bar',
        data: data.map(d => d.count),
        itemStyle: {
          color: CHART_COLORS_V1[0],
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          color: '#ffffff'
        }
      }
    ]
  }), [data, title, xAxisLabel, yAxisLabel]);

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

