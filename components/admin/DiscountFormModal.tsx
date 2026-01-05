// components/admin/DiscountFormModal.tsx
"use client";

import { useState, useEffect, FormEvent } from 'react';
import toast from 'react-hot-toast';
import type { Discount } from '@prisma/client';

type ModalProps = {
  discount: Partial<Discount> | null; // Partial для создания, т.к. нет ID
  partnerId: string;
  onClose: () => void;
  onSave: (discount: Discount) => void;
};

export default function DiscountFormModal({ discount, partnerId, onClose, onSave }: ModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    promoCode: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (discount) {
      setFormData({
        title: discount.title || '',
        description: discount.description || '',
        promoCode: discount.promoCode || '',
        isActive: discount.isActive ?? true,
      });
    } else {
      setFormData({ title: '', description: '', promoCode: '', isActive: true });
    }
  }, [discount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const isCheckbox = type === 'checkbox';
    // @ts-ignore
    setFormData(prev => ({ ...prev, [name]: isCheckbox ? e.target.checked : value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading(discount?.id ? "Обновление..." : "Создание...");

    const url = discount?.id ? `/api/admin/discounts/${discount.id}` : `/api/admin/partners/${partnerId}/discounts`;
    const method = discount?.id ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Произошла ошибка');

      onSave(result);
      toast.success(discount?.id ? 'Скидка обновлена!' : 'Скидка создана!', { id: loadingToast });
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 pt-10 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative my-8">
        <button onClick={onClose} className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-800">&times;</button>
        <h2 className="text-2xl font-bold mb-6">{discount?.id ? 'Редактировать скидку' : 'Создать скидку'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium">Заголовок</label>
            <input id="title" name="title" type="text" value={formData.title} onChange={handleChange} className="input-style mt-1" placeholder="Скидка 10% на масла" required />
          </div>
          <div>
            <label htmlFor="promoCode" className="block text-sm font-medium">Промокод</label>
            <input id="promoCode" name="promoCode" type="text" value={formData.promoCode} onChange={handleChange} className="input-style mt-1" placeholder="ASKMAP10" required />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium">Описание</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} className="input-style mt-1" rows={4} placeholder="Подробное описание условий акции..."></textarea>
          </div>
          <div className="flex items-center gap-2">
            <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
            <label htmlFor="isActive" className="text-sm font-medium">Активна</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm">Отмена</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary px-4 py-2 w-auto text-sm">
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}