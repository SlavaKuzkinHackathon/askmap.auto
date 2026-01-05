// app/(admin)/admin/partners/PartnersClientPage.tsx
"use client";

import { useState } from "react";
import type { Partner } from "@prisma/client";
import toast from "react-hot-toast";
import PartnerFormModal from "@/components/admin/PartnerFormModal";
import React from 'react'; // Добавляем импорт React
import Link from "next/link";
import Image from "next/image";
import PartnerLogo from "@/components/PartnerLogo";

// ОПРЕДЕЛЯЕМ ПРОПСЫ ДЛЯ PartnerRow
type PartnerRowProps = {
  partner: Partner;
  onEdit: () => void;
  onDelete: () => void;
};

// Компонент для одной строки таблицы
// ТЕПЕРЬ ЭТО ПОЛНОЦЕННЫЙ REACT-КОМПОНЕНТ
const PartnerRow: React.FC<PartnerRowProps> = ({ partner, onEdit, onDelete }) => {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-4">
        <div className="flex items-center gap-3">
        <PartnerLogo 
            src={partner.logoUrl} 
            alt={partner.name} 
            className="w-16 h-12" // Задаем размеры здесь
          />
          <div>
            <div className="font-medium text-gray-900">{partner.name}</div>
            <div className="text-xs text-gray-500">{partner.type}</div>
          </div>
        </div>
      </td>
      <td className="p-4">{partner.city}</td>
      <td className="p-4">{partner.phone || '-'}</td>
      <td className="p-4">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          partner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {partner.isActive ? 'Активен' : 'Неактивен'}
        </span>
      </td>
      <td className="p-4 flex gap-4">
        <button onClick={onEdit} className="text-blue-600 hover:underline text-xs font-medium">Редактировать</button>
        <button onClick={onDelete} className="text-red-600 hover:underline text-xs font-medium">Удалить</button>
      </td>
      <td className="p-4 flex gap-4">
        {/* Ссылка на новую страницу скидок */}
        <Link href={`/admin/partners/${partner.id}`} className="text-emerald-600 ...">
          Скидки
        </Link>
      </td>
    </tr>
  );
}

export default function PartnersClientPage({
  initialPartners,
}: {
  initialPartners: Partner[];
}) {
  const [partners, setPartners] = useState(initialPartners);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const handleOpenCreateModal = () => {
    setEditingPartner(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (partner: Partner) => {
    setEditingPartner(partner);
    setIsModalOpen(true);
  };

  const handleDelete = async (partner: Partner) => {
    if (!window.confirm(`Удалить партнера "${partner.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/partners/${partner.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Ошибка удаления");
      setPartners((prev) => prev.filter((p) => p.id !== partner.id));
      toast.success("Партнер удален");
    } catch (e) {
      toast.error("Не удалось удалить партнера");
    }
  };

  const handleSave = (savedPartner: Partner) => {
    if (editingPartner) {
      setPartners((prev) =>
        prev.map((p) => (p.id === savedPartner.id ? savedPartner : p))
      );
    } else {
      setPartners((prev) => [savedPartner, ...prev]);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Управление партнерами
        </h1>
        <button onClick={handleOpenCreateModal} className="btn-primary px-4 py-2 text-sm">
          + Добавить партнера
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-md border ...">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 ...">
            <tr>
              <th scope="col" className="p-4">
                Партнер
              </th>
              <th scope="col" className="p-4">
                Город
              </th>
              <th scope="col" className="p-4">
                Телефон
              </th>
              <th scope="col" className="p-4">
                Статус
              </th>
              <th scope="col" className="p-4">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <PartnerRow
                key={partner.id}
                partner={partner}
                onEdit={() => handleOpenEditModal(partner)}
                onDelete={() => handleDelete(partner)}
              />
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <PartnerFormModal
          partner={editingPartner}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
