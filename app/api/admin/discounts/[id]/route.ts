// app/api/admin/discounts/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Схема Zod для обновления скидки
const updateDiscountSchema = z.object({
  title: z.string().min(3, "Название слишком короткое").optional(),
  description: z.string().optional(),
  promoCode: z.string().min(3, "Промокод слишком короткий").optional(),
  isActive: z.boolean().optional(),
});

// PATCH /api/admin/discounts/[id] - Обновить скидку
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
    const validation = updateDiscountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }

    const updatedDiscount = await prisma.discount.update({
      where: { id },
      data: validation.data,
    });

    revalidatePath("/admin/partners");
    revalidatePath("/discounts");
    revalidatePath("/");

    return NextResponse.json(updatedDiscount);
  } catch (error) {
    console.error(`Ошибка при обновлении скидки ${params.id}:`, error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// DELETE /api/admin/discounts/[id] - Удалить скидку
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
    await prisma.discount.delete({
      where: { id },
    });

    revalidatePath("/admin/partners");
    revalidatePath("/discounts");
    revalidatePath("/");

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Ошибка при удалении скидки ${params.id}:`, error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}