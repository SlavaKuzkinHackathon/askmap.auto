// components/EditRecordModal.tsx
"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ServiceType } from "@prisma/client";

type EditRecordModalProps = {
  recordId: string | null;
  onClose: () => void;
  availableTypes: ServiceType[];
};

type FormData = {
  title: string;
  mileage: string;
  cost: string;
  serviceTypeId: string;
  date: string;
  description: string;
};

export default function EditRecordModal({
  recordId,
  onClose,
  availableTypes
}: EditRecordModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    mileage: "",
    cost: "",
    serviceTypeId: "",
    date: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recordId) {
      requestAnimationFrame(() => setIsVisible(true));
      const fetchRecordData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/servicerecords/${recordId}`);
          if (!response.ok) throw new Error('Не удалось загрузить данные записи');
          const data = await response.json();
          setFormData({
            title: data.title || '',
            mileage: data.mileage?.toString() || '',
            cost: data.cost?.toString() || '',
            serviceTypeId: data.serviceTypeId || '',
            date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
            description: data.description || '',
          });
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Ошибка загрузки');
          handleClose();
        } finally {
          setIsLoading(false);
        }
      };
      fetchRecordData();
    } else {
      setIsVisible(false);
    }
  }, [recordId]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };
    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVisible]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/servicerecords/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Отправляем очищенные данные из `formData`
        body: JSON.stringify({
          title: formData.title,
          mileage: formData.mileage ? parseInt(formData.mileage, 10) : undefined,
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          date: formData.date ? new Date(formData.date).toISOString() : undefined,
          serviceTypeId: formData.serviceTypeId,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        if (result.errors) {
            const errorMessages = Object.values(result.errors).map((err: any) => err._errors.join(', ')).join('; ');
            throw new Error(errorMessages);
        }
        throw new Error(result.error || 'Не удалось обновить запись');
      }

      toast.success('Запись успешно обновлена!');
      handleClose();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка обновления');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!recordId) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 pt-10 overflow-y-auto transition-opacity duration-200 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div ref={modalRef} className={`bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative my-8 transition-all duration-200 ease-in-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <button onClick={handleClose} className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-800 z-10">&times;</button>
        <h2 className="text-2xl font-bold mb-6">Редактировать запись</h2>
        {isLoading ? (
          <div className="min-h-[300px] flex items-center justify-center"><p>Загрузка данных...</p></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-title" className="block mb-2 text-sm font-medium">Название работы</label>
              <input id="edit-title" name="title" type="text" value={formData.title} onChange={handleChange} className="input-style" required />
            </div>
            <div>
              <label htmlFor="edit-mileage" className="block mb-2 text-sm font-medium">Пробег (км)</label>
              <input id="edit-mileage" name="mileage" type="number" value={formData.mileage} onChange={handleChange} className="input-style" />
            </div>
            <div>
              <label htmlFor="edit-date" className="block mb-2 text-sm font-medium">Дата</label>
              <input id="edit-date" name="date" type="date" value={formData.date} onChange={handleChange} className="input-style" />
            </div>
            <div>
              <label htmlFor="edit-type" className="block mb-2 text-sm font-medium">Тип работы</label>
              <select id="edit-type" name="serviceTypeId" value={formData.serviceTypeId} onChange={handleChange} className="input-style">
                {availableTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
             <div>
              <label htmlFor="edit-cost" className="block mb-2 text-sm font-medium">Стоимость (руб.)</label>
              <input id="edit-cost" name="cost" type="number" step="0.01" value={formData.cost} onChange={handleChange} className="input-style" />
            </div>
            <div>
              <label htmlFor="edit-description" className="block mb-2 text-sm font-medium">Описание</label>
              <textarea id="edit-description" name="description" value={formData.description} onChange={handleChange} className="input-style" rows={3}></textarea>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                Отмена
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary px-4 py-2 w-auto">
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
