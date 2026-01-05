// app/api/admin/symptom-causes/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { SymptomCode } from '@prisma/client';

// Схема Zod для обновления. Все поля необязательны.
const updateCauseSchema = z.object({
  symptom: z.nativeEnum(SymptomCode).optional(),
  location: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
  componentId: z.string().cuid().optional(),
  baseWeight: z.number().min(0).max(1).optional(),
});

// PATCH /api/admin/symptom-causes/[id] - Обновить правило
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const id = params.id;
    const body = await request.json();
    const validation = updateCauseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }

    const { symptom, location, condition, componentId, baseWeight } = validation.data;

    const updatedCause = await prisma.symptomCause.update({
      where: { id },
      data: {
        symptom,
        location: location, // `undefined` или `null` будут обработаны Prisma
        condition: condition,
        componentId,
        baseWeight,
      },
      include: {
        component: { select: { name: true } }
      }
    });
    return NextResponse.json(updatedCause);

  } catch (error) {
    console.error(`Ошибка при обновлении правила ${params.id}:`, error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// DELETE /api/admin/symptom-causes/[id] - Удалить правило
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const id = params.id;
    await prisma.symptomCause.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Ошибка при удалении правила ${params.id}:`, error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}