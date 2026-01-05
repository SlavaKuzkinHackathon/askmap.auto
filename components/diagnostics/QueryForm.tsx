"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function QueryForm() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 5) {
      toast.error('Пожалуйста, опишите проблему подробнее.');
      return;
    }
    setIsLoading(true);

    try {
      // 1. Отправляем запрос на наш обновленный `interpret`
      const response = await fetch('/api/diagnostics/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось проанализировать запрос');
      }

      // --- 2. СТРОИМ НОВЫЙ URL С KEYWORDS ---
      const params = new URLSearchParams();
      params.append('symptom', data.symptom);
      params.append('originalText', data.originalText);
      // Добавляем каждое ключевое слово как отдельный параметр
      data.keywords.forEach((keyword: string) => {
        params.append('keywords', keyword);
      });

      // 3. Делаем редирект на страницу результатов
      router.push(`/diagnostics/results?${params.toString()}`);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-32 p-4 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
        placeholder="Например: стучит спереди справа на кочках, или горит чек и машина не тянет..."
        disabled={isLoading}
      />
      <button
        type="submit"
        className="w-full btn-primary py-3"
        disabled={isLoading}
      >
        {isLoading ? 'Анализируем...' : 'Найти причину'}
      </button>
    </form>
  );
}