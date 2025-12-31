import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CHART_COLORS_V2 } from '../../../constants';

interface GrowthRankChartProps {
  data: Array<{ category: string; growthRate: number }>;
  title?: string;
  topN?: number;
}

export const GrowthRankChart: React.FC<GrowthRankChartProps> = ({ 
  data, 
  title = '品类增长排行',
  topN = 10
}) => {
  const chartData = useMemo(() => {
    return data.slice(0, topN).sort((a, b) => a.growthRate - b.growthRate);
  }, [data, topN]);

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
      type: 'value',
      axisLine: { lineStyle: { color: '#d9d9d9' } },
      axisLabel: { color: '#666666' },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    yAxis: {
      type: 'category',
      data: chartData.map(cat => cat.category),
      axisLine: { lineStyle: { color: '#d9d9d9' } },
      axisLabel: { color: '#666666' }
    },
    series: [
      {
        name: '增长率',
        type: 'bar',
        data: chartData.map(cat => cat.growthRate),
        itemStyle: {
          color: (params: any) => {
            const value = params.value;
            return value > 0 ? CHART_COLORS_V2[2] : CHART_COLORS_V2[4];
          }
        },
        label: {
          show: true,
          position: 'right',
          color: '#000000',
          formatter: '{c}%'
        }
      }
    ]
  }), [chartData, title]);

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

