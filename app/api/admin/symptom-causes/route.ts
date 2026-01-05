// app/api/admin/symptom-causes/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { Prisma, SymptomCode } from '@prisma/client';

// Схема Zod для валидации данных при создании нового правила
const causeSchema = z.object({
  symptom: z.nativeEnum(SymptomCode),
  location: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
  componentId: z.string().cuid("Необходимо выбрать компонент"),
  baseWeight: z.number().min(0).max(1),
});

// GET - Получить список всех правил (С ПАГИНАЦИЕЙ И ПОИСКОМ)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;
    
    // Формируем `where` для Prisma

      const where: Prisma.SymptomCauseWhereInput = search 
  ? {
      OR: [
        { location: { contains: search, mode: 'insensitive' } }, 
        { condition: { contains: search, mode: 'insensitive' } },
        { component: { name: { contains: search, mode: 'insensitive' } } },
      ],
    }
  : {};

    // Выполняем два запроса параллельно
    const [data, total] = await Promise.all([
      prisma.symptomCause.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ symptom: 'asc' }, { baseWeight: 'desc' }],
        include: { component: { select: { name: true } } },
      }),
      prisma.symptomCause.count({ where }),
    ]);

    // Возвращаем данные в новом формате
    return NextResponse.json({ data, total });

  } catch (error) {
    console.error('Ошибка при получении правил:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// POST /api/admin/symptom-causes - Создать новое правило
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = causeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }

    const { symptom, location, condition, componentId, baseWeight } = validation.data;

    const newCause = await prisma.symptomCause.create({
      data: {
        symptom,
        // Сохраняем пустую строку как null
        location: location || null,
        condition: condition || null,
        componentId,
        baseWeight,
      },
      include: {
        component: { select: { name: true } }
      }
    });
    return NextResponse.json(newCause, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json({ error: 'Такое правило для данного компонента уже существует' }, { status: 409 });
    }
    console.error('Ошибка при создании правила:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}