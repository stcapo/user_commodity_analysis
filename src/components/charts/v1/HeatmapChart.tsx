import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CHART_COLORS_V1 } from '../../../constants';

interface HeatmapChartProps {
  data: Array<{ [key: string]: any }>;
  xAxisKey: string;
  yAxisKey: string;
  title?: string;
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ 
  data, 
  xAxisKey,
  yAxisKey,
  title = '品类×支付方式热力图'
}) => {
  const { xAxisData, yAxisData, heatmapData, maxValue } = useMemo(() => {
    if (data.length === 0) {
      return { xAxisData: [], yAxisData: [], heatmapData: [], maxValue: 0 };
    }

    const xSet = new Set<string>();
    const ySet = new Set<string>();
    
    data.forEach(row => {
      Object.entries(row).forEach(([key, value]) => {
        if (key !== xAxisKey && typeof value === 'number') {
          xSet.add(key);
        }
      });
      ySet.add(String(row[xAxisKey]));
    });

    const xAxisData = Array.from(xSet);
    const yAxisData = Array.from(ySet);
    
    let max = 0;
    const heatmapData: [number, number, number][] = [];
    
    yAxisData.forEach((yVal, yIndex) => {
      const row = data.find(r => String(r[xAxisKey]) === yVal);
      if (row) {
        xAxisData.forEach((xVal, xIndex) => {
          const value = row[xVal] || 0;
          max = Math.max(max, value);
          heatmapData.push([xIndex, yIndex, value]);
        });
      }
    });

    return { xAxisData, yAxisData, heatmapData, maxValue: max };
  }, [data, xAxisKey, yAxisKey]);

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
      formatter: (params: any) => {
        if (params.componentSubType === 'heatmap') {
          return `${yAxisData[params.value[1]]}<br/>${xAxisData[params.value[0]]}<br/>GMV: ¥${params.value[2]}`;
        }
        return '';
      }
    },
    grid: {
      left: '10%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLine: { lineStyle: { color: 'rgba(0, 217, 255, 0.2)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.7)' }
    },
    yAxis: {
      type: 'category',
      data: yAxisData,
      axisLine: { lineStyle: { color: 'rgba(0, 217, 255, 0.2)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.7)' }
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: 'vertical',
      right: '2%',
      top: 'center',
      inRange: {
        color: ['rgba(0, 217, 255, 0.2)', CHART_COLORS_V1[0]]
      },
      textStyle: { color: '#ffffff' }
    },
    series: [
      {
        name: 'GMV',
        type: 'heatmap',
        data: heatmapData,
        emphasis: {
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1
          }
        }
      }
    ]
  }), [xAxisData, yAxisData, heatmapData, maxValue, title]);

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

