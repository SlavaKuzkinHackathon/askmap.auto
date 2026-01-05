"use client";

import { useState, useMemo } from 'react';
import type { VehicleComponent } from '@prisma/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedComponentId: string | null) => void;
  suggestedName: string;
  allComponents: VehicleComponent[];
}

export default function MatchComponentModal({ isOpen, onClose, onConfirm, suggestedName, allComponents }: Props) {
  const [selectedId, setSelectedId] = useState<string>('');

  const similarComponents = useMemo(() => {
    if (!suggestedName) return [];

    // 1. Разбиваем предложенное AI имя на отдельные слова
    const searchTokens = suggestedName.toLowerCase().split(' ');

    // 2. Проходим по всему справочнику и начисляем "очки"
    const scoredComponents = allComponents.map(component => {
      let score = 0;
      const componentNameLower = component.name.toLowerCase();

      // 3. Проверяем каждое слово из запроса
      searchTokens.forEach(token => {
        // Игнорируем короткие слова (предлоги, союзы)
        if (token.length < 3) return;

        // Если слово из запроса есть в названии компонента - даем очки
        if (componentNameLower.includes(token)) {
          score++;
        }
      });

      return { ...component, score };
    });

    // 4. Фильтруем и сортируем
    return scoredComponents
      .filter(c => c.score > 0) // Оставляем только те, где есть хоть одно совпадение
      .sort((a, b) => b.score - a.score); // Сортируем по количеству совпадений

  }, [suggestedName, allComponents]);
  const handleConfirm = () => {
    // Если выбрано "Создать новый", передаем null
    if (selectedId === 'CREATE_NEW') {
      onConfirm(null);
    } else {
      onConfirm(selectedId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-xl font-semibold">Сопоставьте компонент</h2>
        <p className="text-sm text-gray-500 mt-1">
          AI предложил компонент «<span className="font-bold">{suggestedName}</span>», но он не найден.
          Выберите похожий из списка или создайте новый.
        </p>

        <div className="mt-4">
          <label htmlFor="component-select" className="block text-sm font-medium text-gray-700">Выберите действие</label>
          <select
            id="component-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">-- Выберите существующий компонент --</option>
            {similarComponents.map(comp => (
              <option key={comp.id} value={comp.id}>
                {comp.name} (похожий)
              </option>
            ))}
            <option value="CREATE_NEW" className="font-bold text-emerald-600">
              -- Создать новый компонент «{suggestedName}» --
            </option>
          </select>
        </div>

        <div className="mt-6 flex justify-end space-x-2 border-t pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">Отмена</button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedId} // Кнопка неактивна, пока не сделан выбор
            className="btn-primary"
          >
            Продолжить
          </button>
        </div>
      </div>
    </div>
  );
}