// app/api/partners/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/partners - Получить список активных партнеров и их скидок
export async function GET(request: Request) {
  // Для публичного API нам не нужна проверка сессии

  try {
    const partners = await prisma.partner.findMany({
      // 1. Фильтруем, чтобы показывать только активных партнеров
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
      // 2. Включаем в ответ связанные с ними скидки
      include: {
        // И здесь тоже фильтруем, чтобы показывать только активные скидки
        discounts: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return NextResponse.json(partners);
  } catch (error) {
    console.error('Ошибка при получении списка партнеров:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}