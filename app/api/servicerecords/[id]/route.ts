import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { OdometerSource, ServiceType } from '@prisma/client';

// ========================================================================
// GET /api/servicerecords/[id] - Получить одну запись по ID
// ========================================================================
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 });
  }

  try {
    const recordId = params.id;

    // --- ИСПРАВЛЕННАЯ ЛОГИКА ПРОВЕРКИ ПРАВ ДОСТУПА ---
    // 1. Находим все ID автомобилей, которыми владеет текущий пользователь.
    const userCarOwnerships = await prisma.ownership.findMany({
      where: { 
        userId: session.user.id,
        // endDate: null, // Можно добавить, если нужно разрешать редактировать только историю текущих машин
      },
      select: { carId: true }, // Выбираем только carId
    });
    
    // Преобразуем в простой массив ID
    const userCarIds = userCarOwnerships.map(o => o.carId);

    // 2. Ищем запись по ее ID И проверяем, что ее carId находится в списке машин пользователя.
    const record = await prisma.serviceRecord.findFirst({
      where: {
        id: recordId,
        carId: {
          in: userCarIds, // `in` - это оператор "находится в массиве"
        },
      },
    });
    // --- КОНЕЦ ИСПРАВЛЕННОЙ ЛОГИКИ ---

    if (!record) {
      return NextResponse.json({ error: 'Запись не найдена или у вас нет прав доступа' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error(`Ошибка при получении записи ${params.id}:`, error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// ========================================================================
// PATCH /api/servicerecords/[id] - Обновить (частично) одну запись по ID
// ========================================================================
const updateRecordSchema = z.object({
  title: z.string().min(3).optional(),
  mileage: z.number().int().positive().optional(),
  date: z.string().datetime().optional(),
  cost: z.number().optional(),
  serviceTypeId: z.string().cuid().optional(),
  description: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 });
  }

  try {
    const recordId = params.id;
    const userCarOwnerships = await prisma.ownership.findMany({
      where: { userId: session.user.id },
      select: { carId: true },
    });
    const userCarIds = userCarOwnerships.map(o => o.carId);

    // 1. Проверяем права доступа перед обновлением
    const existingRecord = await prisma.serviceRecord.findFirst({
      where: {
        id: recordId,
        carId: { in: userCarIds },
      },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Запись не найдена или у вас нет прав доступа' }, { status: 404 });
    }

    // 2. Валидируем тело запроса
    const body = await request.json();
    const validation = updateRecordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }

    // 3. Обновляем запись
    const updatedRecord = await prisma.serviceRecord.update({
      where: { id: recordId },
      data: {
        ...validation.data,
        date: validation.data.date ? new Date(validation.data.date) : undefined,
      },
    });

    // Если в ОБНОВЛЕННОЙ записи был изменен пробег,
    // мы должны найти и обновить (или создать) соответствующую запись в OdometerReading.
    // Это более сложная логика, чем простое создание.
    // Для MVP можно применить упрощенный подход: просто создать новую запись о пробеге.
    if (updatedRecord.mileage) {
      await prisma.odometerReading.create({
        data: {
          carId: updatedRecord.carId,
          value: updatedRecord.mileage,
          date: updatedRecord.date || new Date(),
          source: OdometerSource.MANUAL, // Источник - отредактированная запись
        }
      });
       console.log(`Создана НОВАЯ запись OdometerReading после редактирования ServiceRecord ${recordId}`);
    }

    return NextResponse.json(updatedRecord);

  } catch (error) {
    console.error(`Ошибка при обновлении записи ${params.id}:`, error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// ========================================================================
// DELETE /api/servicerecords/[id] - Удалить запись
// ========================================================================
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 });
  }

  try {
    const recordId = params.id;
    const userCarOwnerships = await prisma.ownership.findMany({
      where: { userId: session.user.id },
      select: { carId: true },
    });
    const userCarIds = userCarOwnerships.map(o => o.carId);

    // Проверка прав доступа
    const record = await prisma.serviceRecord.findFirst({
      where: {
        id: recordId,
        carId: { in: userCarIds },
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Запись не найдена или у вас нет прав на ее удаление' }, { status: 404 });
    }

    await prisma.serviceRecord.delete({
      where: { id: recordId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Ошибка при удалении записи ${params.id}:`, error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}