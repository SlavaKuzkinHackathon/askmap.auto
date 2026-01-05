// app/api/auth/register/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';

// Схема валидации Zod для данных регистрации
const registerUserSchema = z.object({
  name: z.string().min(3, "Имя должно быть не менее 3 символов").optional(),
  email: z.string().email({ message: "Неверный формат email" }),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = registerUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }

    const { name, email, password } = validation.data;

    // 1. Проверяем, не существует ли уже пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 } // 409 Conflict
      );
    }

    // 2. Хэшируем пароль
    const passwordHash = await bcrypt.hash(password, 10); // 10 - "соль"

    // 3. Создаем нового пользователя в базе данных
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash, // Сохраняем именно хэш
      },
    });
    
    // Не возвращаем хэш пароля на клиент
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    return NextResponse.json(
      { error: "Не удалось зарегистрировать пользователя" },
      { status: 500 }
    );
  }
}