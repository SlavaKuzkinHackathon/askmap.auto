// app/api/admin/components/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { ComponentCategory, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Схема для валидации данных при создании (включает все поля)
const componentSchema = z.object({
  name: z.string().min(1, "Название не может быть пустым"),
  partCode: z.string().min(1, "PartCode не может быть пустым"),
  slug: z.string().nullable(),
  category: z.nativeEnum(ComponentCategory),
  description: z.string().nullable(),
  lifespanKm: z.number().nullable(),
  lifespanMonths: z.number().nullable(),
  importance: z.number().min(1).max(5),
  isSafetyCritical: z.boolean(),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;
    
    const where: Prisma.VehicleComponentWhereInput = search 
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { partCode: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.vehicleComponent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.vehicleComponent.count({ where }),
    ]);

    return NextResponse.json({ data, total });

  } catch (error) {
    console.error('Ошибка при получении списка компонентов:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // 1. Проверка сессии админа
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = componentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }
    
    // 2. Проверка, что partCode уникален
    const existing = await prisma.vehicleComponent.findUnique({ where: { partCode: validation.data.partCode } });
    if (existing) {
      return NextResponse.json({ error: 'Компонент с таким PartCode уже существует' }, { status: 409 });
    }

    const newComponent = await prisma.vehicleComponent.create({
      data: validation.data,
    });

    return NextResponse.json(newComponent, { status: 201 });
  } catch (error) {
    console.error("Ошибка при создании компонента:", error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}