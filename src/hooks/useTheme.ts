import { useCallback } from 'react';

export function useTheme() {
  const version = 'v2' as const;

  const switchVersion = useCallback(() => {
    // 强制不允许切换
    localStorage.setItem('bi-version', 'v2');
  }, []);

  const toggleVersion = useCallback(() => {
    localStorage.setItem('bi-version', 'v2');
  }, []);

  return {
    version,
    switchVersion,
    toggleVersion,
    isV1: false,
    isV2: true
  };
}

