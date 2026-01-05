// components/NewCarForm.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function NewCarForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    vin: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          year: parseInt(formData.year, 10), // Преобразуем год в число
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Обрабатываем ошибки валидации от Zod
        if (result.errors) {
          const errorMessages = Object.values(result.errors).map((err: any) => err._errors.join(', ')).join('; ');
          throw new Error(errorMessages);
        }
        throw new Error('Не удалось добавить автомобиль');
      }

      toast.success('Автомобиль успешно добавлен!');
      // После добавления перенаправляем пользователя в "Гараж"
      router.push('/garage');
      router.refresh(); // Обновляем данные на странице гаража

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка';
      toast.error(errorMessage); // 3. Заменяем setError()
        } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white border rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="make" className="block mb-2 text-sm font-medium">Марка</label>
          <input id="make" name="make" type="text" value={formData.make} onChange={handleChange} className="input-style" placeholder="Toyota" required />
        </div>
        <div>
          <label htmlFor="model" className="block mb-2 text-sm font-medium">Модель</label>
          <input id="model" name="model" type="text" value={formData.model} onChange={handleChange} className="input-style" placeholder="Camry" required />
        </div>
        <div>
          <label htmlFor="year" className="block mb-2 text-sm font-medium">Год выпуска</label>
          <input id="year" name="year" type="number" value={formData.year} onChange={handleChange} className="input-style" placeholder="2020" required />
        </div>
        <div>
          <label htmlFor="licensePlate" className="block mb-2 text-sm font-medium">Номерной знак (необязательно)</label>
          <input id="licensePlate" name="licensePlate" type="text" value={formData.licensePlate} onChange={handleChange} className="input-style" placeholder="А123БВ777" />
        </div>
        <div>
          <label htmlFor="vin" className="block mb-2 text-sm font-medium">VIN или номер кузова (необязательно)</label>
          <input 
            id="vin" 
            name="vin" 
            type="text" 
            value={formData.vin} 
            onChange={handleChange} 
            className="input-style uppercase" // Добавим uppercase для удобства
            placeholder="17-значный номер или Frame №"
            maxLength={17}
          />
        </div>

        {error && <p className="text-red-500 text-sm bg-red-100 p-2 rounded">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-gray-400"
        >
          {isSubmitting ? 'Добавление...' : 'Добавить автомобиль'}
        </button>
      </form>
    </div>
  );
}