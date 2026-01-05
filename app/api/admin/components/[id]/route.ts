// app/api/admin/components/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { ComponentCategory } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Схема для обновления, все поля необязательные
const updateComponentSchema = z.object({
  name: z.string().min(1).optional(),
  partCode: z.string().min(1).optional(),
  slug: z.string().nullable().optional(),
  category: z.nativeEnum(ComponentCategory).optional(),
  description: z.string().nullable().optional(),
  lifespanKm: z.number().nullable().optional(),
  lifespanMonths: z.number().nullable().optional(),
  importance: z.number().min(1).max(5).optional(),
  isSafetyCritical: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = updateComponentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }

    // Проверка уникальности partCode, если он был изменен
    if (validation.data.partCode) {
        const existing = await prisma.vehicleComponent.findFirst({
            where: {
                partCode: validation.data.partCode,
                NOT: { id: params.id },
            }
        });
        if (existing) {
            return NextResponse.json({ error: 'Компонент с таким PartCode уже существует' }, { status: 409 });
        }
    }

    const updatedComponent = await prisma.vehicleComponent.update({
      where: { id: params.id },
      data: validation.data,
    });

    return NextResponse.json(updatedComponent);
  } catch (error) {
    console.error(`Ошибка при обновлении компонента ${params.id}:`, error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    try {
        await prisma.vehicleComponent.delete({
            where: { id: params.id },
        });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Ошибка при удалении компонента ${params.id}:`, error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}