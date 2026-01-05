// app/api/admin/cars/[carId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

const updateCarSchema = z.object({
  make: z.string().min(2),
  model: z.string().min(1),
  year: z.number().int(),
  vin: z.string().min(5).max(17).optional().nullable(),
  licensePlate: z.string().optional().nullable(),
});

// PATCH /api/admin/cars/[carId]
export async function PATCH(
  request: Request,
  { params }: { params: { carId: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const id = params.carId;
    const body = await request.json();
    const validation = updateCarSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }

    const updatedCar = await prisma.car.update({
      where: { id },
      data: validation.data,
    });
    return NextResponse.json(updatedCar);
  } catch (error) {
    console.error(`Ошибка при обновлении авто ${params.carId}:`, error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// DELETE /api/admin/cars/[carId]
export async function DELETE(
  request: Request,
  { params }: { params: { carId: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const id = params.carId;
    await prisma.car.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Ошибка при удалении авто ${params.carId}:`, error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}