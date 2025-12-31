import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { CategoryData } from '../../../types';
import { CHART_COLORS_V1 } from '../../../constants';

interface CategoryBarChartProps {
  data: CategoryData[];
  title?: string;
  topN?: number;
}

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({ 
  data, 
  title = '热门品类排行',
  topN = 8
}) => {
  const chartData = useMemo(() => {
    return data.slice(0, topN).sort((a, b) => a.gmv - b.gmv);
  }, [data, topN]);

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
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(0, 217, 255, 0.2)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.7)' },
      splitLine: { lineStyle: { color: 'rgba(0, 217, 255, 0.1)' } }
    },
    yAxis: {
      type: 'category',
      data: chartData.map(cat => cat.category),
      axisLine: { lineStyle: { color: 'rgba(0, 217, 255, 0.2)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.7)' }
    },
    series: [
      {
        name: 'GMV',
        type: 'bar',
        data: chartData.map(cat => cat.gmv),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: CHART_COLORS_V1[0] },
            { offset: 1, color: CHART_COLORS_V1[1] }
          ])
        },
        label: {
          show: true,
          position: 'right',
          color: '#ffffff'
        }
      }
    ]
  }), [chartData, title]);

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

