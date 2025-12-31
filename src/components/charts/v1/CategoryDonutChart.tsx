import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CategoryData } from '../../../types';
import { CHART_COLORS_V1 } from '../../../constants';

interface CategoryDonutChartProps {
  data: CategoryData[];
  title?: string;
  topN?: number;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({ 
  data, 
  title = '品类GMV环形图',
  topN = 5
}) => {
  const chartData = useMemo(() => {
    const top = data.slice(0, topN);
    const others = data.slice(topN);
    const othersGmv = others.reduce((sum, cat) => sum + cat.gmv, 0);
    
    const result = top.map(cat => ({
      name: cat.category,
      value: cat.gmv
    }));
    
    if (othersGmv > 0) {
      result.push({
        name: '其他',
        value: othersGmv
      });
    }
    
    return result;
  }, [data, topN]);

  const option = useMemo(() => ({
    title: {
      text: title,
      textStyle: { color: '#ffffff', fontSize: 14, fontWeight: 600 }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderColor: 'rgba(0, 217, 255, 0.3)',
      textStyle: { color: '#ffffff' },
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#ffffff' }
    },
    series: [
      {
        name: 'GMV',
        type: 'pie',
        radius: ['40%', '70%'],
        data: chartData,
        itemStyle: {
          borderColor: 'rgba(10, 14, 39, 0.8)',
          borderWidth: 2
        },
        label: {
          color: '#ffffff'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 217, 255, 0.5)'
          }
        },
        color: CHART_COLORS_V1
      }
    ]
  }), [chartData, title]);

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

