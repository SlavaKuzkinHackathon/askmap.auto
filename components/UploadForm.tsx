// components/UploadForm.tsx
"use client"; // <-- ВАЖНО! Эта директива говорит Next.js, что компонент интерактивный и должен работать в браузере.

import { useState } from 'react';
import { DocumentType } from '@prisma/client';

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string>('');
  
  // Временный ID машины для теста. В будущем будем брать из данных пользователя.
  const carId = "cme6rjl880000g44ekncthun8"; // <--- ЗАМЕНИТЕ НА ID РЕАЛЬНОЙ МАШИНЫ ИЗ ВАШЕЙ БАЗЫ!

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      alert('Пожалуйста, выберите файл!');
      return;
    }

    setUploading(true);
    setResult('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', DocumentType.WORK_ORDER); // Тип по умолчанию
    formData.append('carId', carId);

    try {
      // 1. Отправляем файл на загрузку
      const uploadResponse = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Ошибка при загрузке файла');
      }
      
      const uploadResult = await uploadResponse.json();
      setResult(`Файл загружен! ID документа: ${uploadResult.id}. Начинаем парсинг...`);
      
      // 2. Запускаем парсинг
      const parseResponse = await fetch(`/api/documents/${uploadResult.id}/parse`, {
        method: 'POST',
      });
      
      if (!parseResponse.ok) {
        throw new Error('Ошибка при парсинге документа');
      }

      const parseResult = await parseResponse.json();
      setResult(`Парсинг завершен! ID черновика: ${parseResult.serviceRecordId}\n\n` + JSON.stringify(parseResult.document.parsed, null, 2));

    } catch (error) {
      console.error(error);
      setResult(`Произошла ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-8 p-4 border rounded-lg max-w-md">
      <h2 className="text-xl font-semibold mb-4">Загрузить документ</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="file-upload" className="block mb-2 text-sm font-medium text-gray-900">
            Выберите чек или заказ-наряд...
          </label>
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-gray-400"
        >
          {uploading ? 'Загрузка...' : 'Загрузить и распознать'}
        </button>
      </form>
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Результат:</h3>
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
}