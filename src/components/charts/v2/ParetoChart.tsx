import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CHART_COLORS_V2 } from '../../../constants';

interface ParetoChartProps {
  data: Array<{ rank: number; gmv: number; cumulative: number }>;
  title?: string;
}

export const ParetoChart: React.FC<ParetoChartProps> = ({ 
  data, 
  title = '用户GMV帕累托图'
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
      data: ['GMV', '累计占比'],
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
      data: data.slice(0, 50).map(d => `用户${d.rank}`),
      axisLine: { lineStyle: { color: '#d9d9d9' } },
      axisLabel: { color: '#666666', interval: 4 }
    },
    yAxis: [
      {
        type: 'value',
        name: 'GMV (¥)',
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666666' },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      {
        type: 'value',
        name: '累计占比 (%)',
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666666' },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      }
    ],
    series: [
      {
        name: 'GMV',
        type: 'bar',
        data: data.slice(0, 50).map(d => d.gmv),
        itemStyle: { color: CHART_COLORS_V2[0] },
        yAxisIndex: 0
      },
      {
        name: '累计占比',
        type: 'line',
        data: data.slice(0, 50).map(d => d.cumulative),
        smooth: true,
        itemStyle: { color: CHART_COLORS_V2[1] },
        yAxisIndex: 1,
        label: {
          show: false
        }
      }
    ]
  }), [data, title]);

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

