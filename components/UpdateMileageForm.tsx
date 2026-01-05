// components/UpdateMileageForm.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type UpdateMileageFormProps = {
  carId: string;
  lastKnownMileage: number | null; // Передаем последний известный пробег
};

export default function UpdateMileageForm({ carId, lastKnownMileage }: UpdateMileageFormProps) {
  const router = useRouter();
  const [mileage, setMileage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mileage) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading('Обновляем пробег...');

    try {
      const response = await fetch('/api/odometer-readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId,
          value: parseInt(mileage, 10),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Не удалось обновить пробег');
      }

      toast.success('Пробег успешно обновлен!', { id: loadingToast });
      setMileage(''); // Очищаем поле
      router.refresh(); // Перезагружаем данные на странице "Гаража"

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-sm text-yellow-800 mb-2">
         🟡 **Уточните пробег!** Актуальные данные помогут точнее рассчитать сроки ТО.
      </p>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="number"
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
          className="input-style w-full"
          placeholder={`> ${lastKnownMileage || 0} км`}
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary px-4 py-2 w-auto whitespace-nowrap"
        >
          {isSubmitting ? '...' : 'Обновить'}
        </button>
      </form>
    </div>
  );
}