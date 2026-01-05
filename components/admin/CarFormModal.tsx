// components/admin/CarFormModal.tsx
"use client";

import { useState, useEffect, FormEvent } from 'react';
import toast from 'react-hot-toast';
import type { Car } from "@prisma/client";

type ModalProps = {
  car: Car | null;
  onClose: () => void;
  onSave: (car: Car) => void;
};

export default function CarFormModal({ car, onClose, onSave }: ModalProps) {
  const [formData, setFormData] = useState({
    make: '', model: '', year: '', vin: '', licensePlate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (car) {
      setFormData({
        make: car.make,
        model: car.model,
        year: car.year.toString(),
        vin: car.vin || '',
        licensePlate: car.licensePlate || '',
      });
    }
  }, [car]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading("Сохранение...");

    try {
      const response = await fetch(`/api/admin/cars/${car?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          year: parseInt(formData.year, 10),
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Ошибка сохранения');
      
      onSave(result);
      toast.success('Автомобиль обновлен!', { id: loadingToast });
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!car) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 pt-10 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative my-8">
        <button onClick={onClose} className="absolute top-3 right-3 text-2xl ...">&times;</button>
        <h2 className="text-2xl font-bold mb-6">Редактировать автомобиль</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="make" className="block ...">Марка</label>
            <input id="make" name="make" type="text" value={formData.make} onChange={handleChange} className="input-style mt-1" required />
          </div>
          <div>
            <label htmlFor="model" className="block ...">Модель</label>
            <input id="model" name="model" type="text" value={formData.model} onChange={handleChange} className="input-style mt-1" required />
          </div>
          <div>
            <label htmlFor="year" className="block ...">Год</label>
            <input id="year" name="year" type="number" value={formData.year} onChange={handleChange} className="input-style mt-1" required />
          </div>
          <div>
            <label htmlFor="vin" className="block ...">VIN / Номер кузова</label>
            <input id="vin" name="vin" type="text" value={formData.vin} onChange={handleChange} className="input-style mt-1" />
          </div>
          <div>
            <label htmlFor="licensePlate" className="block ...">Номерной знак</label>
            <input id="licensePlate" name="licensePlate" type="text" value={formData.licensePlate} onChange={handleChange} className="input-style mt-1" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 ...">Отмена</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary ...">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
}