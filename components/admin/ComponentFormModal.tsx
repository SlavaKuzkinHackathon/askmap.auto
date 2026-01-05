//components/admin/ComponentFormModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { VehicleComponent, ComponentCategory } from '@prisma/client';

const categoryOptions = Object.values(ComponentCategory);

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (component: VehicleComponent) => void;
  initialData?: Partial<VehicleComponent> | null;
}

export default function ComponentFormModal({ isOpen, onClose, onSave, initialData }: Props) {
  const [name, setName] = useState('');
  const [partCode, setPartCode] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<ComponentCategory>(ComponentCategory.OTHER);
  const [description, setDescription] = useState('');
  const [lifespanKm, setLifespanKm] = useState('');
  const [lifespanMonths, setLifespanMonths] = useState('');
  const [importance, setImportance] = useState('3');
  const [isSafetyCritical, setIsSafetyCritical] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = Boolean(initialData && initialData.id);

  useEffect(() => {
    if (isOpen) {
      // СЦЕНАРИЙ 1: Редактирование существующего компонента
      if (initialData && initialData.id) {
        setName(initialData.name || '');
        setPartCode(initialData.partCode || '');
        setSlug(initialData.slug || '');
        setCategory(initialData.category || ComponentCategory.OTHER);
        setDescription(initialData.description || '');
        setLifespanKm(initialData.lifespanKm?.toString() || '');
        setLifespanMonths(initialData.lifespanMonths?.toString() || '');
        setImportance(initialData.importance?.toString() || '3');
        setIsSafetyCritical(initialData.isSafetyCritical || false);
      } 
      // СЦЕНАРИЙ 2: Создание нового компонента по шаблону от AI
      else if (initialData && initialData.name) {
        // Заполняем только имя, остальное сбрасываем по умолчанию
        setName(initialData.name);
        setPartCode(initialData.name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
        setSlug('');
        setCategory(ComponentCategory.OTHER);
        setDescription('');
        setLifespanKm('');
        setLifespanMonths('');
        setImportance('3');
        setIsSafetyCritical(false);
      }
      // СЦЕНАРИЙ 3: Создание компонента с нуля
      else {
        setName('');
        setPartCode('');
        setSlug('');
        setCategory(ComponentCategory.OTHER);
        setDescription('');
        setLifespanKm('');
        setLifespanMonths('');
        setImportance('3');
        setIsSafetyCritical(false);
      }
      setError(null);
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!name) {
      setError("Название является обязательным полем.");
      setIsLoading(false); return;
    }
    
    const finalPartCode = partCode.trim() === ''
      ? name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      : partCode.trim();

    if (!finalPartCode) {
      setError("Не удалось сгенерировать PartCode.");
      setIsLoading(false); return;
    }

    const body = {
      name, partCode: finalPartCode, slug: slug.trim() === '' ? null : slug.trim(),
      category, description: description.trim() === '' ? null : description.trim(),
      lifespanKm: lifespanKm ? parseInt(lifespanKm, 10) : null,
      lifespanMonths: lifespanMonths ? parseInt(lifespanMonths, 10) : null,
      importance: parseInt(importance, 10), isSafetyCritical,
    };

    try {
      const response = await fetch(
        isEditMode ? `/api/admin/components/${initialData?.id}` : '/api/admin/components',
        { method: isEditMode ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось сохранить компонент');
      }
      const savedComponent = await response.json();
      onSave(savedComponent); // <-- Здесь все правильно, он вызывает onSave с данными
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <button onClick={onClose} className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-gray-800">&times;</button>
        <h2 className="text-xl font-semibold">{isEditMode ? 'Редактировать компонент' : 'Создать компонент'}</h2>
        
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Название</label>
              <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Категория</label>
              <select id="category" value={category} onChange={e => setCategory(e.target.value as ComponentCategory)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="partCode" className="block text-sm font-medium text-gray-700">PartCode (уникальный ID)</label>
            <input id="partCode" type="text" value={partCode} onChange={e => setPartCode(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="naprimer_oil_filter" required />
            <p className="text-xs text-gray-500 mt-1">Латиница, нижнее подчеркивание. Не меняется после создания.</p>
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug (для SVG-карты)</label>
            <input id="slug" type="text" value={slug} onChange={e => setSlug(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="zone_engine (необязательно)" />
          </div>
          <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Описание (необязательно)</label>
              <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lifespanKm" className="block text-sm font-medium text-gray-700">Ресурс (км)</label>
              <input id="lifespanKm" type="number" value={lifespanKm} onChange={e => setLifespanKm(e.target.value)} placeholder="10000" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="lifespanMonths" className="block text-sm font-medium text-gray-700">Ресурс (мес.)</label>
              <input id="lifespanMonths" type="number" value={lifespanMonths} onChange={e => setLifespanMonths(e.target.value)} placeholder="12" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label htmlFor="importance" className="block text-sm font-medium text-gray-700">Важность (1-5)</label>
            <input id="importance" type="number" value={importance} min="1" max="5" onChange={e => setImportance(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div className="flex items-center">
            <input id="isSafetyCritical" type="checkbox" checked={isSafetyCritical} onChange={e => setIsSafetyCritical(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            <label htmlFor="isSafetyCritical" className="ml-2 block text-sm text-gray-900">Критично для безопасности</label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="mt-6 flex justify-end space-x-2 border-t pt-4">
            <button type="button" onClick={onClose} disabled={isLoading} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Отмена</button>
            <button type="submit" disabled={isLoading} className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}