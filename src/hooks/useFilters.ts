import { useState, useCallback } from 'react';
import { FilterState } from '../types';

const initialFilters: FilterState = {
  dateRange: null,
  categories: [],
  paymentMethods: [],
  gender: 'All',
  ageGroups: []
};

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const updateDateRange = useCallback((dateRange: [string, string] | null) => {
    setFilters(prev => ({ ...prev, dateRange }));
  }, []);

  const updateCategories = useCallback((categories: string[]) => {
    setFilters(prev => ({ ...prev, categories }));
  }, []);

  const updatePaymentMethods = useCallback((paymentMethods: string[]) => {
    setFilters(prev => ({ ...prev, paymentMethods }));
  }, []);

  const updateGender = useCallback((gender: 'All' | 'Male' | 'Female') => {
    setFilters(prev => ({ ...prev, gender }));
  }, []);

  const updateAgeGroups = useCallback((ageGroups: string[]) => {
    setFilters(prev => ({ ...prev, ageGroups }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.dateRange !== null ||
      filters.categories.length > 0 ||
      filters.paymentMethods.length > 0 ||
      filters.gender !== 'All' ||
      filters.ageGroups.length > 0
    );
  }, [filters]);

  return {
    filters,
    updateDateRange,
    updateCategories,
    updatePaymentMethods,
    updateGender,
    updateAgeGroups,
    clearFilters,
    hasActiveFilters
  };
}

