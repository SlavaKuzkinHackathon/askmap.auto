// app/(admin)/admin/partners/[id]/DiscountsClientPage.tsx
"use client";

import { useState } from 'react';
import type { Discount } from "@prisma/client";
import toast from 'react-hot-toast';
import DiscountFormModal from '@/components/admin/DiscountFormModal';

function DiscountRow({ discount, onEdit, onDelete }: { discount: Discount, onEdit: () => void, onDelete: () => void }) {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-4">
        <div className="font-medium text-gray-900">{discount.title}</div>
        <div className="text-xs text-gray-500">{discount.description}</div>
      </td>
      <td className="p-4 font-mono text-blue-600">{discount.promoCode}</td>
      <td className="p-4">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          discount.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {discount.isActive ? 'Активна' : 'Неактивна'}
        </span>
      </td>
      <td className="p-4 flex gap-4">
        <button onClick={onEdit} className="text-blue-600 hover:underline text-xs font-medium">Редактировать</button>
        <button onClick={onDelete} className="text-red-600 hover:underline text-xs font-medium">Удалить</button>
      </td>
    </tr>
  );
}

export default function DiscountsClientPage({ partnerId, initialDiscounts }: { partnerId: string, initialDiscounts: Discount[] }) {
  const [discounts, setDiscounts] = useState(initialDiscounts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  const handleOpenCreateModal = () => {
    setEditingDiscount(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (discount: Discount) => {
    setEditingDiscount(discount);
    setIsModalOpen(true);
  };

  const handleDelete = async (discount: Discount) => {
    if (!window.confirm(`Удалить скидку "${discount.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/discounts/${discount.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка удаления');
      setDiscounts(prev => prev.filter(d => d.id !== discount.id));
      toast.success('Скидка удалена');
    } catch (e) {
      toast.error('Не удалось удалить скидку');
    }
  };

  const handleSave = (savedDiscount: Discount) => {
    if (editingDiscount) {
      setDiscounts(prev => prev.map(d => d.id === savedDiscount.id ? savedDiscount : d));
    } else {
      setDiscounts(prev => [savedDiscount, ...prev]);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Скидки и акции</h2>
        <button onClick={handleOpenCreateModal} className="btn-primary px-4 py-2 text-sm">
          + Добавить скидку
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
            <tr>
              <th scope="col" className="p-4">Название и Описание</th>
              <th scope="col" className="p-4">Промокод</th>
              <th scope="col" className="p-4">Статус</th>
              <th scope="col" className="p-4">Действия</th>
            </tr>
          </thead>
          <tbody>
            {discounts.length > 0 ? (
              discounts.map(discount => (
                <DiscountRow 
                  key={discount.id} 
                  discount={discount}
                  onEdit={() => handleOpenEditModal(discount)}
                  onDelete={() => handleDelete(discount)}
                />
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  Для этого партнера еще не добавлено ни одной скидки.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <DiscountFormModal 
          discount={editingDiscount}
          partnerId={partnerId}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}