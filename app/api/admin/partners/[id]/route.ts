// app/api/admin/partners/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { PartnerType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Схема Zod для данных, которые мы разрешаем обновлять.
// Все поля сделаны необязательными для PATCH-запроса.
const updatePartnerSchema = z.object({
  name: z.string().min(2, "Название слишком короткое").optional(),
  type: z.nativeEnum(PartnerType).optional(),
  city: z.string().min(2, "Укажите город").optional(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url("Неверный формат URL").optional().nullable(),
  logoUrl: z.string().url("Неверный формат URL").optional().nullable(),
  inn: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// PATCH /api/admin/partners/[id] - Обновить партнера
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
    const validation = updatePartnerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }

    // "Разбираем" валидированные данные.
    // Если какое-то поле не пришло, его значение будет `undefined`.
    const { name, type, city, address, phone, website, logoUrl, inn, isActive } = validation.data;
    
    // Prisma.update умная: если передать `undefined` в качестве значения,
    // она просто проигнорирует это поле и не будет его обновлять.
    // Это именно то, что нужно для PATCH.
    const updatedPartner = await prisma.partner.update({
      where: { id },
      data: {
        name,
        type,
        city,
        address,
        phone,
        website,
        logoUrl,
        inn,
        isActive,
      },
    });

    revalidatePath("/admin/partners");
    revalidatePath("/discounts");
    revalidatePath("/");

    return NextResponse.json(updatedPartner);

  } catch (error) {
    console.error(`Ошибка при обновлении партнера ${params.id}:`, error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// DELETE /api/admin/partners/[id] - Удалить партнера
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
    await prisma.partner.delete({
      where: { id },
    });

    revalidatePath("/admin/partners");
    revalidatePath("/discounts");
    revalidatePath("/");

    // Успешное удаление возвращает пустой ответ со статусом 204
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Ошибка при удалении партнера ${params.id}:`, error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}