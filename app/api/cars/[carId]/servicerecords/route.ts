// app/api/cars/[carId]/servicerecords/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/cars/[carId]/servicerecords
export async function GET(
  request: Request,
  { params }: { params: { carId: string } }
) {
  try {
    const { carId } = params;

    if (!carId) {
      return NextResponse.json(
        { error: 'ID автомобиля не предоставлен' },
        { status: 400 }
      );
    }

    const serviceRecords = await prisma.serviceRecord.findMany({
      where: {
        carId: carId, // Находим записи только для этого автомобиля
      },
      orderBy: {
        date: 'desc', // Сортируем по дате, чтобы новые были сверху
      },
      // Можно также включить связанные данные, если понадобится
      // include: {
      //   components: true,
      // }
    });

    return NextResponse.json(serviceRecords);

  } catch (error) {
    console.error(`Ошибка при получении истории обслуживания для авто ${params.carId}:`, error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}