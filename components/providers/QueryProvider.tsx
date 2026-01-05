// components/providers/QueryProvider.tsx

'use client'; // Этот компонент - клиентский, так как он создает клиент и использует Provider

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Создаем инстанс QueryClient. 
// Мы делаем это ВНЕ компонента, чтобы он не создавался заново при каждом рендере.
const queryClient = new QueryClient();

// Наш компонент-обертка
export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    // Передаем созданный клиент в провайдер
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}