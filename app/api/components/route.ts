// app/api/components/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { ComponentCategory, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Описываем схему валидации для входящих данных
const componentSchema = z.object({
  name: z.string().min(3, { message: 'Название должно быть не менее 3 символов' }),
  partCode: z.string().min(1, "PartCode не может быть пустым"),
  slug: z.string().regex(/^[a-z0-9_]+$/, { message: 'Slug может содержать только a-z, 0-9 и _' }).nullable(),
  category: z.nativeEnum(ComponentCategory), // Проверяем, что значение есть в нашем enum
  description: z.string().optional(), // Необязательное поле
  lifespanKm: z.number().nullable(),
  lifespanMonths: z.number().nullable(),
  importance: z.number().min(1).max(5),
  isSafetyCritical: z.boolean(),
});

// Получить список всех компонентов
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Доступ запрещен. Необходима авторизация.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);

    const isPaginated = searchParams.has('page');

    if (isPaginated) {
      // --- ЛОГИКА ДЛЯ АДМИНКИ С ПАГИНАЦИЕЙ ---
      if (session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
      }
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const skip = (page - 1) * limit;
      const where: Prisma.VehicleComponentWhereInput = search ? {
        OR: [{ name: { contains: search, mode: 'insensitive' } },
        { partCode: { contains: search, mode: 'insensitive' } },]
      } : {};
      const [data, total] = await Promise.all([
        prisma.vehicleComponent.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
        prisma.vehicleComponent.count({ where }),
      ]);
      // Возвращаем объект для админки
      return NextResponse.json({ data, total });

    } else {
      const components = await prisma.vehicleComponent.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          lifespanKm: true, // <-- Это поле нужно для подсказки
        },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(components);
    }

  } catch (error) {
    console.error('Ошибка при получении списка компонентов:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// POST /api/components - Создать новый авто-компонент
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const body = await request.json();
    // Теперь валидация будет проходить по полной схеме
    const validation = componentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }

    const existing = await prisma.vehicleComponent.findUnique({ where: { partCode: validation.data.partCode } });
    if (existing) {
      return NextResponse.json({ error: 'Компонент с таким PartCode уже существует' }, { status: 409 });
    }

    // Теперь `validation.data` содержит все необходимые поля, включая partCode
    const newComponent = await prisma.vehicleComponent.create({
      data: validation.data,
    });

    return NextResponse.json(newComponent, { status: 201 });
  } catch (error) {
    console.error("Ошибка при создании компонента:", error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}