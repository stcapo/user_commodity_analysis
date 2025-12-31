import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface CalendarHeatmapProps {
  data: Array<{ date: string; gmv: number }>;
  title?: string;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ 
  data, 
  title = '日历热力图'
}) => {
  const { calendarData, maxValue } = useMemo(() => {
    const chartData = data.map(d => [d.date, d.gmv]);
    const max = Math.max(...data.map(d => d.gmv));
    return { calendarData: chartData, maxValue: max };
  }, [data]);

  const startDate = data.length > 0 ? data[0].date : '2022-01-01';
  const endDate = data.length > 0 ? data[data.length - 1].date : '2023-03-31';

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
          return `${params.value[0]}<br/>GMV: ¥${params.value[1]}`;
        }
        return '';
      }
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: 'horizontal',
      bottom: 20,
      inRange: {
        color: ['rgba(0, 217, 255, 0.2)', '#00D9FF', '#00FF88']
      },
      textStyle: { color: '#ffffff' }
    },
    calendar: [
      {
        range: [startDate, endDate],
        cellSize: ['auto', 13],
        top: 80,
        left: 80,
        splitLine: {
          show: true,
          lineStyle: {
            color: 'rgba(0, 217, 255, 0.1)',
            width: 1,
            type: 'solid'
          }
        },
        yearLabel: {
          show: true,
          textStyle: { color: '#ffffff' }
        },
        dayLabel: {
          textStyle: { color: 'rgba(255, 255, 255, 0.7)' }
        },
        monthLabel: {
          textStyle: { color: 'rgba(255, 255, 255, 0.7)' }
        }
      }
    ],
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: calendarData,
        itemStyle: {
          borderColor: 'rgba(0, 217, 255, 0.1)',
          borderWidth: 0.5
        }
      }
    ]
  }), [calendarData, maxValue, startDate, endDate, title]);

  return <ReactECharts option={option} style={{ height: 500 }} />;
};

