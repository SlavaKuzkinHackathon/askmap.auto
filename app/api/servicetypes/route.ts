// app/api/servicetypes/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/servicetypes - Получить список всех типов работ
export async function GET() {
  try {
    const serviceTypes = await prisma.serviceType.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(serviceTypes);
  } catch (error) {
    console.error('Ошибка при получении типов работ:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}