"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { VehicleComponent, ServiceType } from '@prisma/client';
import toast from 'react-hot-toast';

type ManualRecordFormProps = { carId: string; serviceTypes: ServiceType[]; };

export default function ManualRecordForm({ carId }: ManualRecordFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    mileage: '',
    cost: '',
    serviceTypeId: '', // Храним ID типа работы
    date: new Date().toISOString().split('T')[0],
  });
  
  const [availableComponents, setAvailableComponents] = useState<VehicleComponent[]>([]);
  const [availableTypes, setAvailableTypes] = useState<ServiceType[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string>('');
  const [lifespanKm, setLifespanKm] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Загружаем справочники при первой загрузке компонента
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [componentsRes, typesRes] = await Promise.all([
          fetch('/api/components'),
          fetch('/api/servicetypes'),
        ]);
        if (!componentsRes.ok || !typesRes.ok) throw new Error('Ошибка загрузки справочников');

        const componentsData = await componentsRes.json();
        const typesData = await typesRes.json();

        setAvailableComponents(componentsData);
        setAvailableTypes(typesData);

        // Устанавливаем тип "Прочее" по умолчанию, если он есть
        const otherType = typesData.find((t: ServiceType) => t.slug === 'other');
        if (otherType) {
            setFormData(prev => ({...prev, serviceTypeId: otherType.id}));
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Не удалось загрузить справочники");
      }
    };
    fetchData();
  }, []);

  // Обновляем рекомендованный ресурс при выборе компонента
  useEffect(() => {
    if (selectedComponentId) {
      const component = availableComponents.find(c => c.id === selectedComponentId);
      setLifespanKm(component?.lifespanKm?.toString() || '');
    } else {
      setLifespanKm('');
    }
  }, [selectedComponentId, availableComponents]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/servicerecords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId,
          title: formData.title,
          mileage: formData.mileage ? parseInt(formData.mileage, 10) : undefined,
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          date: formData.date ? new Date(formData.date).toISOString() : undefined,
          serviceTypeId: formData.serviceTypeId,
          components: selectedComponentId ? [selectedComponentId] : [],
          installedPartLifespanKm: lifespanKm ? parseInt(lifespanKm, 10) : undefined,
        }),
      });
      
      const result = await response.json();
      if (!response.ok) {
        if (result.errors) {
            const errorMessages = Object.values(result.errors).map((err: any) => err._errors.join(', ')).join('; ');
            throw new Error(errorMessages);
        }
        throw new Error(result.error || 'Не удалось создать запись');
      }
      toast.success('Запись успешно добавлена!');
      router.refresh();
      // Очистка формы
      setFormData({ 
        title: '', mileage: '', cost: '', 
        serviceTypeId: formData.serviceTypeId, // Оставляем выбранный тип
        date: new Date().toISOString().split('T')[0] 
      });
      setSelectedComponentId('');

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 p-6 border rounded-lg max-w-lg mx-auto bg-white shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Добавить новую запись</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block mb-2 text-sm font-medium">Название работы</label>
          <input id="title" name="title" type="text" value={formData.title} onChange={handleChange} className="input-style" placeholder="Например, Замена масла" required />
        </div>
        <div>
          <label htmlFor="mileage" className="block mb-2 text-sm font-medium">Пробег (км)</label>
          <input id="mileage" name="mileage" type="number" value={formData.mileage} onChange={handleChange} className="input-style" placeholder="150000" />
        </div>
        <div>
          <label htmlFor="date" className="block mb-2 text-sm font-medium">Дата</label>
          <input id="date" name="date" type="date" value={formData.date} onChange={handleChange} className="input-style" />
        </div>
        <div>
          <label htmlFor="serviceTypeId" className="block mb-2 text-sm font-medium">Тип работы</label>
          <select id="serviceTypeId" name="serviceTypeId" value={formData.serviceTypeId} onChange={handleChange} className="input-style">
            {availableTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cost" className="block mb-2 text-sm font-medium">Стоимость (руб.)</label>
          <input id="cost" name="cost" type="number" step="0.01" value={formData.cost} onChange={handleChange} className="input-style" placeholder="5000.00" />
        </div>
        
        <div>
          <label htmlFor="component" className="block mb-2 text-sm font-medium">Основная работа/деталь</label>
          <select id="component" value={selectedComponentId} onChange={(e) => setSelectedComponentId(e.target.value)} className="input-style">
            <option value="">-- Выберите работу --</option>
            {availableComponents
              .filter(c => c.slug === null || !c.slug.startsWith('zone_'))
              .map(c => ( <option key={c.id} value={c.id}>{c.name}</option> ))
            }
          </select>
        </div>

        {selectedComponentId && (
          <div className="p-3 bg-gray-50 rounded-lg border">
            <label htmlFor="lifespan" className="block mb-2 text-sm font-medium">
              Пробег до следующей замены/диагностики (км)
            </label>
            <input id="lifespan" type="number" value={lifespanKm} onChange={(e) => setLifespanKm(e.target.value)} className="input-style" placeholder="Рекомендованный пробег" />
            <p className="mt-2 text-xs text-gray-500">
              <b>Внимание:</b> Это эталонное значение для расчета. Оно может отличаться от рекомендаций производителя.
            </p>
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="w-full btn-primary">
          {isSubmitting ? 'Сохранение...' : 'Сохранить запись'}
        </button>
      </form>
    </div>
  );
}