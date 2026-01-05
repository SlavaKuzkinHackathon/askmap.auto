// components/admin/ParseUrlModal.tsx
"use client";

// Мы снова используем useState и добавляем useEffect
import { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function ParseUrlModal({ isOpen, onClose, onAnalyze, isLoading, error }: Props) {
 
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl(''); 
    }
  }, [isOpen]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <button onClick={onClose} className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-gray-800">&times;</button>
        <h2 className="text-xl font-semibold">Анализ URL с форума</h2>
        <p className="text-sm text-gray-500 mt-1">Вставьте ссылку на тему, например, с Drom.ru или Drive2.ru</p>
        
        <form onSubmit={handleSubmit} className="mt-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://forums.drom.ru/..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
            // Автофокус на поле при открытии для удобства
            autoFocus 
          />
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <div className="mt-6 flex justify-end space-x-2">
            <button type="button" onClick={onClose} disabled={isLoading} className="btn-secondary">Отмена</button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Анализ...' : 'Анализировать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

