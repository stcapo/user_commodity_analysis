import { useState, useCallback, useEffect } from 'react';
import { VersionType } from '../types';

export function useTheme() {
  const [version, setVersion] = useState<VersionType>('v1');

  // Load version from localStorage on mount
  useEffect(() => {
    const savedVersion = localStorage.getItem('bi-version') as VersionType | null;
    if (savedVersion && (savedVersion === 'v1' || savedVersion === 'v2')) {
      setVersion(savedVersion);
    }
  }, []);

  const switchVersion = useCallback((newVersion: VersionType) => {
    setVersion(newVersion);
    localStorage.setItem('bi-version', newVersion);
  }, []);

  const toggleVersion = useCallback(() => {
    const newVersion = version === 'v1' ? 'v2' : 'v1';
    switchVersion(newVersion);
  }, [version, switchVersion]);

  return {
    version,
    switchVersion,
    toggleVersion,
    isV1: version === 'v1',
    isV2: version === 'v2'
  };
}

