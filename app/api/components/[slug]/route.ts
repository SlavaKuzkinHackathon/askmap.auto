// app/api/components/[slug]/route.ts
// Этот файл отвечает за операции над ОДНИМ конкретным компонентом,
// который определяется по его [slug] в URL.

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 1. GET /api/components/[slug] - Получить один компонент по slug
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const component = await prisma.vehicleComponent.findUnique({
      where: { slug: params.slug },
    });

    if (!component) {
      return NextResponse.json({ error: 'Компонент не найден' }, { status: 404 });
    }

    return NextResponse.json(component);
  } catch (error) {
    console.error(`Ошибка при получении компонента ${params.slug}:`, error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// 2. PATCH /api/components/[slug] - Обновить компонент по slug
export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json();
    // Позволяем обновлять только некоторые поля
    const { name, category, description } = body;

    const updatedComponent = await prisma.vehicleComponent.update({
      where: { slug: params.slug },
      data: { name, category, description },
    });

    return NextResponse.json(updatedComponent);
  } catch (error) {
    console.error(`Ошибка при обновлении компонента ${params.slug}:`, error);
    return NextResponse.json({ error: 'Не удалось обновить компонент' }, { status: 500 });
  }
}

// 3. DELETE /api/components/[slug] - Удалить компонент по slug
export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await prisma.vehicleComponent.delete({
      where: { slug: params.slug },
    });
    // Успешное удаление не возвращает тело ответа
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Ошибка при удалении компонента ${params.slug}:`, error);
    return NextResponse.json({ error: 'Не удалось удалить компонент' }, { status: 500 });
  }
}