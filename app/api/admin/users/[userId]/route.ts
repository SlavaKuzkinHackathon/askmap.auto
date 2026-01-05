// app/api/admin/users/[userId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { Role } from '@prisma/client';

// Схема Zod для данных, которые мы разрешаем обновлять
const updateUserSchema = z.object({
  // Пока что разрешаем менять только роль
  role: z.nativeEnum(Role),
});

// PATCH /api/admin/users/[userId] - Обновить роль пользователя
export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const userId = params.userId;
    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }

    const { role } = validation.data;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: role,
      },
      // Снова выбираем только безопасные поля для ответа
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error(`Ошибка при обновлении пользователя ${params.userId}:`, error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}