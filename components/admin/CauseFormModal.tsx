// components/admin/CauseFormModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { getSymptomCodeName, SymptomCode } from '@/lib/helpers';


// Определяем типы, как и раньше
type SymptomCauseData = {
  id: string;
  symptom: SymptomCode;
  location: string | null;
  condition: string | null;
  baseWeight: number;
  componentId: string;
};

// Тип для объекта, который мы будем передавать обратно на страницу
type SavedCause = SymptomCauseData & { component: { name: string } };

// --- ИЗМЕНЕНИЕ 1: Обновляем интерфейс пропсов ---
interface KnbFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Меняем onSuccess: () => void на onSave, который принимает сохраненные данные
  onSave: (cause: SavedCause) => void; 
  initialData?: SymptomCauseData | null;
  components: { id: string, name: string }[];
}

const symptomOptions = Object.values(SymptomCode);

// Обновляем деструктуризацию пропсов
export default function CauseFormModal({ isOpen, onClose, onSave, initialData, components }: KnbFormModalProps) {
  const [symptom, setSymptom] = useState<SymptomCode>(SymptomCode.KNOCK);
  const [location, setLocation] = useState('');
  const [condition, setCondition] = useState('');
  const [componentId, setComponentId] = useState('');
  const [baseWeight, setBaseWeight] = useState(0.5);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = Boolean(initialData && initialData.id);

  useEffect(() => {
    if (isOpen) {
      // Сначала проверяем, есть ли ВООБЩЕ данные для предзаполнения.
      // Это сработает и для РЕДАКТИРОВАНИЯ, и для ПРЕДЛОЖЕНИЙ AI.
      if (initialData) {
        setSymptom(initialData.symptom);
        setLocation(initialData.location || '');
        setCondition(initialData.condition || '');
        setComponentId(initialData.componentId);
        setBaseWeight(initialData.baseWeight);
      } else {
        // Если initialData нет, значит это "Создание с нуля". Сбрасываем форму.
        resetForm();
      }
    }
  }, [initialData, isOpen]); // Убираем isEditMode из зависимостей, он здесь не нужен

  const resetForm = () => {
    setSymptom(SymptomCode.KNOCK);
    setLocation('');
    setCondition('');
    setComponentId('');
    setBaseWeight(0.5);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!componentId || !symptom) {
        setError("Симптом и компонент-причина должны быть выбраны.");
        setIsLoading(false);
        return;
    }

    const body = {
      symptom,
      location: location.trim() === '' ? null : location.trim(),
      condition: condition.trim() === '' ? null : condition.trim(),
      componentId,
      baseWeight: Number(baseWeight),
    };

    try {
      const response = await fetch(
        isEditMode ? `/api/admin/symptom-causes/${initialData?.id}` : '/api/admin/symptom-causes',
        {
          method: isEditMode ? 'PATCH' : 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        // Попытаемся получить текст ошибки от сервера
        const errorData = await response.json().catch(() => ({ error: 'Не удалось получить детали ошибки' }));
        throw new Error(errorData.error || 'Не удалось сохранить правило');
      }

      const savedCause = await response.json();
      onSave(savedCause);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  // ... остальная JSX-разметка без изменений
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold">
          {isEditMode ? 'Редактировать правило' : 'Создать новое правило'}
        </h2>
        
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="symptom" className="block text-sm font-medium text-gray-700">Основной симптом</label>
            <select id="symptom" value={symptom} onChange={(e) => setSymptom(e.target.value as SymptomCode)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              {/* --- 2. Применяем функцию перевода для отображения --- */}
              {symptomOptions.map(opt => (
                <option key={opt} value={opt}>
                  {getSymptomCodeName(opt)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="componentId" className="block text-sm font-medium text-gray-700">Компонент-причина</label>
            <select id="componentId" value={componentId} onChange={(e) => setComponentId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="">-- Выберите компонент --</option>
              {components.map(comp => <option key={comp.id} value={comp.id}>{comp.name}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Локация (необязательно)</label>
            <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Напр., 'Спереди справа'" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>

          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700">Условие (необязательно)</label>
            <input type="text" id="condition" value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Напр., 'На кочках'" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          
          <div>
            <label htmlFor="baseWeight" className="block text-sm font-medium text-gray-700">Базовая вероятность: {Math.round(baseWeight * 100)}%</label>
            <input type="range" id="baseWeight" min="0" max="1" step="0.05" value={baseWeight} onChange={(e) => setBaseWeight(parseFloat(e.target.value))} className="mt-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex justify-end space-x-2">
            <button type="button" onClick={onClose} disabled={isLoading} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              Отмена
            </button>
            <button type="submit" disabled={isLoading} className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
