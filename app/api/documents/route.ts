// app/api/documents/route.ts
// Этот эндпоинт отвечает на POST-запросы на /api/documents.
// Его задача - принять файл, сохранить его и создать запись в таблице Document.

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DocumentType, DocumentStatus } from '@prisma/client';

// ЗАГЛУШКА для функции загрузки файла в облачное хранилище (S3, MinIO и т.д.)
async function uploadToStorage(file: File): Promise<string> {
  console.log(`[ЗАГЛУШКА] Загрузка файла "${file.name}" в хранилище...`);
  // В реальном проекте здесь будет код для загрузки файла в S3
  // и возврата его уникального URL.
  // Для теста мы просто генерируем фейковый URL.
  const fakeStorageUrl = `s3://askmap-bucket/${crypto.randomUUID()}-${file.name}`;
  console.log(`[ЗАГЛУШКА] Файл сохранен по URL: ${fakeStorageUrl}`);
  return fakeStorageUrl;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const typeStr = (form.get('type') as string) || 'OTHER';
    const carId = form.get('carId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не был предоставлен' }, { status: 400 });
    }
    if (!carId) {
      return NextResponse.json({ error: 'carId является обязательным' }, { status: 400 });
    }
    // Простая валидация типа документа
    const type = (Object.values(DocumentType) as string[]).includes(typeStr)
      ? (typeStr as DocumentType)
      : DocumentType.OTHER;

    // Шаг 1: "Загружаем" файл в хранилище и получаем URL
    const storageUrl = await uploadToStorage(file);

    // Шаг 2: Создаем запись в базе данных
    const doc = await prisma.document.create({
      data: {
        type,
        status: DocumentStatus.UPLOADED, // Начальный статус - "загружен"
        storageUrl,
        carId,
      },
    });

    // Возвращаем клиенту основную информацию о созданном документе
    return NextResponse.json({
      id: doc.id,
      status: doc.status,
      storageUrl: doc.storageUrl
    }, { status: 201 });

  } catch (error) {
    console.error('Ошибка при загрузке документа:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}