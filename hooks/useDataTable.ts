// hooks/useDataTable.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce'; // Популярная библиотека для дебаунса

export interface PaginatedData<T> {
  data: T[];
  total: number;
}

export function useDataTable<T>(apiUrl: string, initialLimit = 20) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Дебаунс: ждем 300мс после того, как пользователь перестал печатать, и только потом ищем
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Строим URL с параметрами
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      
      const response = await fetch(`${apiUrl}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Не удалось загрузить данные');
      }
      
      const result: PaginatedData<T> = await response.json();
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error(error);
      // Можно добавить toast.error(...)
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, page, limit, debouncedSearchTerm]);

  // Этот useEffect будет следить за изменениями и вызывать fetchData
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Сбрасываем на первую страницу при поиске
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  return {
    data,
    isLoading,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    setPage,
    setLimit,
    searchTerm,
    setSearchTerm,
    refresh: fetchData, // Функция для принудительного обновления
  };
}