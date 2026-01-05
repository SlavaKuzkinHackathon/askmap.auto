// app/api/cars/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Импортируем наши authOptions
import { Ownership } from '@prisma/client';

// схема валидации для создания нового автомобиля
const createCarSchema = z.object({
  make: z.string().min(2, "—лишком короткое название марки"),
  model: z.string().min(1, "”кажите модель"),
  year: z.number().int().min(1900, "—лишком старый год").max(new Date().getFullYear() + 1, "√од не может быть в будущем"),
  licensePlate: z.string().optional(),
  vin: z.string().min(5, "ID должен быть длиннее 5 символов").max(17, "ID не может быть длиннее 17 символов").optional(),
});

// GET /api/cars - Получить список автомобилей ТЕКУЩЕГО пользователя
export async function GET() {
  // 1. Получаем сессию
  const session = await getServerSession(authOptions);

  // 2. Если сессии нет, возвращаем ошибку "не авторизован"
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 });
  }

  try {
    // 3. Находим все "владения" (ownerships) для текущего пользователя
    const ownerships = await prisma.ownership.findMany({
      where: {
        userId: session.user.id, // Фильтруем по ID пользователя из сессии
        endDate: null,          // Только текущие владения
      },
      include: {
        // Включаем данные о самом автомобиле
        car: true, 
      },
    });
    
    // 4. Извлекаем только данные об автомобилях из "владений"
    const cars = ownerships.map(o => o.car);

    return NextResponse.json(cars);
  } catch (error) {
    console.error('Ошибка при получении списка автомобилей:', error);
    return NextResponse.json({ error: 'Не удалось получить данные' }, { status: 500 });
  }
}

// POST /api/cars - Создать новый автомобиль для ТЕКУЩЕГО пользователя
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = createCarSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }
    
    // Используем транзакцию, чтобы гарантировать создание и машины, и владения
    const newCar = await prisma.$transaction(async (tx) => {
      // 1. Создаем автомобиль
      const car = await tx.car.create({
        data: validation.data,
      });

      // 2. Создаем запись о владении, связывая авто с текущим пользователем
      await tx.ownership.create({
        data: {
          carId: car.id,
          userId: session.user.id,
        },
      });
      return car;
    });

    return NextResponse.json(newCar, { status: 201 });

  } catch (error) {
    // ... (обработка ошибок)
  }
}