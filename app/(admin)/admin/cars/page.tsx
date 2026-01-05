// app/(admin)/admin/cars/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Car } from "@prisma/client";
import toast from 'react-hot-toast';
import CarFormModal from '@/components/admin/CarFormModal';

// Тип с email владельца
type CarWithOwner = Car & { ownerEmail?: string | null };

const formatDate = (date: Date | string) => new Date(date).toLocaleDateString('ru-RU');

// Отдельный компонент для строки таблицы
function CarRow({ car, onEdit, onDelete }: { car: CarWithOwner, onEdit: () => void, onDelete: () => void }) {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-4 font-medium text-gray-900">{car.make} {car.model}</td>
      <td className="p-4">{car.year}</td>
      <td className="p-4">
        <div className="font-mono text-xs">{car.vin || '-'}</div>
        <div className="text-xs text-gray-500">{car.licensePlate || '-'}</div>
      </td>
      <td className="p-4">{car.ownerEmail || 'Нет владельца'}</td>
      <td className="p-4">{formatDate(car.createdAt)}</td>
      <td className="p-4 flex gap-4">
        <button onClick={onEdit} className="text-blue-600 hover:underline text-xs font-medium">Редактировать</button>
        <button onClick={onDelete} className="text-red-600 hover:underline text-xs font-medium">Удалить</button>
      </td>
    </tr>
  );
}

// Основной клиентский компонент
export default function AdminCarsPage() {
  const [cars, setCars] = useState<CarWithOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  useEffect(() => {
    const fetchCars = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/cars');
        if (!res.ok) throw new Error('Ошибка загрузки');
        setCars(await res.json());
      } catch (e) {
        toast.error('Не удалось загрузить список автомобилей');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCars();
  }, []);
  
  const handleSave = (savedCar: Car) => {
    // Просто перезагружаем все данные, чтобы подтянуть email владельца
    fetch('/api/admin/cars').then(res => res.json()).then(setCars);
  };
  
  const handleDelete = async (car: Car) => {
    if (!window.confirm(`Удалить ${car.make} ${car.model}? Это действие необратимо.`)) return;
    try {
      const res = await fetch(`/api/admin/cars/${car.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка удаления');
      setCars(prev => prev.filter(c => c.id !== car.id));
      toast.success('Автомобиль удален');
    } catch (e) {
      toast.error('Не удалось удалить автомобиль');
    }
  };

  if (isLoading) return <div>Загрузка автомобилей...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Управление автомобилями</h1>
      <div className="bg-white rounded-lg shadow-md border ...">
        <table className="w-full text-left text-sm">
          {/* ... thead ... */}
          <tbody>
            {cars.map(car => (
              <CarRow 
                key={car.id} 
                car={car}
                onEdit={() => setEditingCar(car)}
                onDelete={() => handleDelete(car)}
              />
            ))}
          </tbody>
        </table>
      </div>
      {editingCar && (
        <CarFormModal
          car={editingCar}
          onClose={() => setEditingCar(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}