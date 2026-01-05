"use client";

import { useState } from 'react';
import type { VehicleComponent } from "@prisma/client";
import toast from "react-hot-toast";
import ComponentFormModal from '@/components/admin/ComponentFormModal';
import { useRouter } from 'next/navigation';
import { useDataTable } from '@/hooks/useDataTable';
import SearchInput from '@/components/admin/SearchInput';
import Pagination from '@/components/admin/Pagination';

const ComponentRow = ({
  component,
  onEdit,
  onDelete,
}: {
  component: VehicleComponent;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-4">
        <div className="font-medium text-gray-900">{component.name}</div>
        <div className="text-xs text-gray-500">{component.category}</div>
      </td>
      <td className="p-4 font-mono text-xs">{component.partCode}</td>
      <td className="p-4 font-mono text-xs text-gray-400">{component.slug || '-'}</td>
      <td className="p-4 text-center">{component.lifespanKm || '-'}</td>
      <td className="p-4 text-center">{component.lifespanMonths || '-'}</td>
      <td className="p-4 text-center">{component.importance}</td>
      <td className="p-4 text-center">
        {component.isSafetyCritical && (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Да
          </span>
        )}
      </td>
      <td className="p-4 flex gap-4 justify-end">
        <button onClick={onEdit} className="text-blue-600 hover:underline text-xs font-medium">Редактировать</button>
        <button onClick={onDelete} className="text-red-600 hover:underline text-xs font-medium">Удалить</button>
      </td>
    </tr>
  );
};

export default function ComponentsClientPage() {
  const router = useRouter();

  // --- ИСПОЛЬЗУЕМ НАШ НОВЫЙ "МОЗГ" ---
  const {
    data: components,
    isLoading,
    pagination,
    setPage,
    searchTerm,
    setSearchTerm,
    refresh,
  } = useDataTable<VehicleComponent>('/api/admin/components');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<VehicleComponent | null>(null);
 
  // Эта функция теперь правильно обрабатывает оба случая
  const handleOpenModal = (component: VehicleComponent | null) => {
    setEditingComponent(component);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingComponent(null);
  };
  
  const handleSave = () => {
    handleCloseModal();
    toast.success("Компонент успешно сохранен!");
    refresh(); // <-- Просто обновляем данные с сервера
  };
  
  const handleDelete = async (componentToDelete: VehicleComponent) => {
    if (!window.confirm(`Вы уверены, что хотите удалить компонент "${componentToDelete.name}"?`)) return;
    try {
      await fetch(`/api/admin/components/${componentToDelete.id}`, { method: 'DELETE' });
      toast.success("Компонент успешно удален!");
      refresh(); // <-- Просто обновляем данные с сервера
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка');
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Справочник компонентов</h1>
        {/* --- ИСПРАВЛЕНИЕ №3: Передаем null явно, чтобы показать намерение --- */}
        <button onClick={() => handleOpenModal(null)} className="btn-primary">
          + Добавить компонент
        </button>
      </div>

      <div className="mb-4">
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Поиск по названию или PartCode..." />
      </div>
      
      <div className="bg-white rounded-lg shadow-md border overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
            <tr>
              <th scope="col" className="p-4">Название / Категория</th>
              <th scope="col" className="p-4">PartCode</th>
              <th scope="col" className="p-4">Slug (для карты)</th>
              <th scope="col" className="p-4 text-center">Ресурс, км</th>
              <th scope="col" className="p-4 text-center">Ресурс, мес.</th>
              <th scope="col" className="p-4 text-center">Важность</th>
              <th scope="col" className="p-4 text-center">Безопасность</th>
              <th scope="col" className="p-4 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
          {isLoading ? (
              <tr><td colSpan={8} className="text-center p-8 text-gray-500">Загрузка...</td></tr>
            ) : components && components.length > 0 ? (
              components.map((component) => (
                <ComponentRow
                  key={component.id}
                  component={component}
                  onEdit={() => handleOpenModal(component)}
                  onDelete={() => handleDelete(component)}
                />
              ))
            ) : (
              <tr><td colSpan={8} className="text-center p-8 text-gray-500">{searchTerm ? `Ничего не найдено по запросу "${searchTerm}"` : 'Компоненты еще не добавлены.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />
      
      {isModalOpen && (
        <ComponentFormModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          initialData={editingComponent}
        />
      )}
    </div>
  );
}