// components/admin/PartnerFormModal.tsx
"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import type { Partner } from '@prisma/client'; // Partner импортируем как тип
import { PartnerType } from '@/lib/helpers'; // ПРАВИЛЬНО: PartnerType импортируем из хелпера


// 1. ОПРЕДЕЛЯЕМ ЯВНЫЙ ТИП ДЛЯ НАШЕГО СОСТОЯНИЯ ФОРМЫ
type FormData = {
    name: string;
    type: PartnerType; // Указываем, что `type` может быть любым значением из enum
    city: string;
    address: string;
    phone: string;
    website: string;
    logoUrl: string;
    inn: string;
    isActive: boolean;
  };
  
  type ModalProps = {
    partner: Partial<Partner> | null;
    onClose: () => void;
    onSave: (partner: Partner) => void;
  };

const typeOptions = Object.values(PartnerType);

export default function PartnerFormModal({ partner, onClose, onSave }: ModalProps) {
  // 2. ИСПОЛЬЗУЕМ НАШ НОВЫЙ ТИП В `useState`
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: PartnerType.SERVICE_CENTER,
    city: '',
    address: '',
    phone: '',
    website: '',
    logoUrl: '',
    inn: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  //STATE для процесса загрузки файла
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name || '',
        type: partner.type || PartnerType.SERVICE_CENTER,
        city: partner.city || '',
        address: partner.address || '',
        phone: partner.phone || '',
        website: partner.website || '',
        logoUrl: partner.logoUrl || '',
        inn: partner.inn || '',
        isActive: partner.isActive ?? true,
      });
    } else {
      // Сброс для создания нового
      setFormData({
        name: '', type: PartnerType.SERVICE_CENTER, city: '', address: '',
        phone: '', website: '', logoUrl: '', inn: '', isActive: true,
      });
    }
  }, [partner]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const isCheckbox = type === 'checkbox';
    // @ts-ignore
    setFormData(prev => ({ ...prev, [name]: isCheckbox ? e.target.checked : value }));
  };


  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const loadingToast = toast.loading('Загрузка логотипа...');

    try {
      const data = new FormData();
      data.set('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) throw new Error('Не удалось загрузить файл');

      const result = await res.json();
      
      // Обновляем formData, вставляя полученный URL
      setFormData(prev => ({ ...prev, logoUrl: result.url }));
      toast.success('Логотип загружен!', { id: loadingToast });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка загрузки", { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading(partner?.id ? "Обновление..." : "Создание...");

    const url = partner?.id ? `/api/admin/partners/${partner.id}` : '/api/admin/partners';
    const method = partner?.id ? 'PATCH' : 'POST';

    // 1. Готовим данные для отправки.
    // Сначала берем все из formData, а потом перезаписываем то, что нужно.
    const dataToSend = {
      ...formData,
      address: formData.address || null,
      phone: formData.phone || null,
      website: formData.website || null,
      logoUrl: formData.logoUrl || null,
      inn: formData.inn || null,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        // 3. Отправляем подготовленный объект `dataToSend`.
        body: JSON.stringify(dataToSend),
      });
      
      const result = await response.json();
      if (!response.ok) {
        if (result.errors) {
            const errorMessages = Object.values(result.errors).map((err: any) => err._errors.join(', ')).join('; ');
            throw new Error(errorMessages);
        }
        throw new Error(result.error || 'Произошла ошибка');
      }
      
      onSave(result);
      toast.success(partner?.id ? 'Партнер обновлен!' : 'Партнер создан!', { id: loadingToast });
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 pt-10 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl relative my-8">
        <button onClick={onClose} className="absolute top-3 right-3 text-2xl ...">&times;</button>
        <h2 className="text-2xl font-bold mb-6">{partner?.id ? 'Редактировать партнера' : 'Создать партнера'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm ...">Название</label>
              <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} className="input-style mt-1" required />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm ...">Тип</label>
              <select id="type" name="type" value={formData.type} onChange={handleChange} className="input-style mt-1">
                {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="city" className="block text-sm ...">Город</label>
              <input id="city" name="city" type="text" value={formData.city} onChange={handleChange} className="input-style mt-1" required />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm ...">Адрес</label>
              <input id="address" name="address" type="text" value={formData.address} onChange={handleChange} className="input-style mt-1" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm ...">Телефон</label>
              <input id="phone" name="phone" type="text" value={formData.phone} onChange={handleChange} className="input-style mt-1" />
            </div>
             <div>
              <label htmlFor="inn" className="block text-sm ...">ИНН</label>
              <input id="inn" name="inn" type="text" value={formData.inn} onChange={handleChange} className="input-style mt-1" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="website" className="block text-sm ...">Веб-сайт</label>
              <input id="website" name="website" type="url" value={formData.website} onChange={handleChange} className="input-style mt-1" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="logoUrl" className="block text-sm ...">URL логотипа</label>
              <input id="logoUrl" name="logoUrl" type="text" value={formData.logoUrl} onChange={handleChange} className="input-style mt-1" placeholder="https://... или загрузите файл"/>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="logoUpload" className="block text-sm ...">Или загрузить файл</label>
              <input 
                id="logoUpload" name="logoUpload" type="file" 
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp, image/svg+xml"
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                disabled={isUploading}
              />
              {isUploading && <p className="text-xs text-gray-500 mt-1">Идет загрузка...</p>}
            </div>

            <div className="flex items-center gap-2">
              <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 rounded ..." />
              <label htmlFor="isActive" className="text-sm ...">Активен</label>
            </div>
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