// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/admin/users - Получить список всех пользователей
export async function GET() {
  const session = await getServerSession(authOptions);

  // Двойная проверка: middleware уже проверил, но лучше проверить и здесь.
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 }); // 403 Forbidden
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      // Мы не хотим отправлять хэши паролей на клиент, даже в админку
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
    });

    const serializableUsers = users.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    return NextResponse.json(serializableUsers);
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}