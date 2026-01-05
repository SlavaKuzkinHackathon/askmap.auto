"use client";

import { useState } from 'react';
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { SafeServiceRecord } from "@/app/(main)/garage/(car)/[carId]/page";
import type { ServiceType } from "@prisma/client";
import EditRecordModal from './EditRecordModal';

type ServiceHistoryListProps = {
  records: SafeServiceRecord[];
  serviceTypes: ServiceType[];
};

export default function ServiceHistoryList({ records, serviceTypes }: ServiceHistoryListProps) {
  const router = useRouter();
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const getServiceTypeName = (typeId: string | null | undefined): string => {
    if (!typeId) return "Не указан";
    const foundType = serviceTypes.find(t => t.id === typeId);
    return foundType?.name || "Неизвестный тип";
  };

  const handleDelete = async (recordId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      return;
    }
    try {
      const response = await fetch(`/api/servicerecords/${recordId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Не удалось удалить запись');
      }
      toast.success('Запись успешно удалена');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Дата не указана';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  const formatCost = (cost: number | null) => {
    if (cost === null || cost === undefined) return null;
    return cost.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 });
  };
  
  const formatMileage = (mileage: number | null) => {
    if (mileage === null || mileage === undefined) return null;
    return `${mileage.toLocaleString('ru-RU')} км`;
  };

  if (records.length === 0) {
    return (
      <div className="mt-8 text-center text-gray-500 py-10 border-2 border-dashed rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold">История пока пуста</h3>
        <p className="mt-1">Добавьте первую запись, используя форму справа.</p>
      </div>
    );
  }

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold mb-4">История обслуживания</h2>
        <div className="space-y-4">
          {records.map((record) => {
            const formattedCost = formatCost(record.cost);
            const formattedMileage = formatMileage(record.mileage);
            return (
              <div key={record.id} className="p-4 border rounded-lg bg-white shadow-sm relative group transition-shadow hover:shadow-md">
                <div className="pr-24">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-800">{record.title}</h3>
                    <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                      {formatDate(record.date)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    {getServiceTypeName(record.serviceTypeId)}
                  </div>
                  <div className="mt-2 flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    {formattedMileage && <span className="text-gray-500">{formattedMileage}</span>}
                    {formattedCost && <span className="text-gray-500">| {formattedCost}</span>}
                  </div>
                  {record.description && (
                    <p className="mt-3 text-sm text-gray-700 bg-gray-50 p-2 rounded">{record.description}</p>
                  )}
                </div>
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button onClick={() => setEditingRecordId(record.id)} className="text-xs font-medium text-blue-600 hover:underline">
                    Редактировать
                  </button>
                  <button onClick={() => handleDelete(record.id)} className="text-xs font-medium text-red-600 hover:underline">
                    Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <EditRecordModal 
        recordId={editingRecordId} 
        onClose={() => setEditingRecordId(null)}
        availableTypes={serviceTypes}
      />
    </>
  );
}