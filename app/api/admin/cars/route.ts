// app/api/admin/cars/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/admin/cars - Получить список всех автомобилей
export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const cars = await prisma.car.findMany({
      orderBy: { createdAt: 'desc' },
      // Включаем информацию о текущем владельце
      include: {
        ownershipHistory: {
          where: { endDate: null },
          include: {
            user: {
              select: { email: true }
            }
          }
        }
      }
    });
    return NextResponse.json(cars);
  } catch (error) {
    console.error('Ошибка при получении списка авто:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}