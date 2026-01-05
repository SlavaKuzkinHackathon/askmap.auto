// app/api/odometer-readings/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { OdometerSource } from '@prisma/client';

// Схема валидации для входящих данных
const createOdometerReadingSchema = z.object({
  carId: z.string().cuid(),
  value: z.number().int().positive("Пробег должен быть положительным числом"),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = createOdometerReadingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }
    
    const { carId, value } = validation.data;

    // TODO: Добавить проверку, что carId принадлежит текущему пользователю

    // Проверяем, не пытается ли пользователь "скрутить" пробег
    const lastReading = await prisma.odometerReading.findFirst({
      where: { carId },
      orderBy: { date: 'desc' },
    });

    if (lastReading && value < lastReading.value) {
      return NextResponse.json(
        { error: `Новый пробег (${value} км) не может быть меньше последнего известного (${lastReading.value} км).` },
        { status: 400 }
      );
    }

    const newReading = await prisma.odometerReading.create({
      data: {
        carId,
        value,
        source: OdometerSource.MANUAL, // Источник - ручной ввод
      },
    });

    return NextResponse.json(newReading, { status: 201 });

  } catch (error) {
    console.error('Ошибка при добавлении записи о пробеге:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}