import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import dayjs from 'dayjs';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPage = useCallback(async (elementId: string = 'root') => {
    setIsExporting(true);
    setError(null);

    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('导出元素未找到');
      }

      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `BI分析报告_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.png`;
      link.click();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '导出失败，请重试';
      setError(errorMessage);
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    error,
    exportPage,
    clearError: () => setError(null)
  };
}

