// app/api/cars/[carId]/component-states/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ComponentStatus } from '@prisma/client';
import { calculateComponentStates } from '@/lib/statusCalculator';

export type ComponentStateInfo = {
  slug: string;
  name: string;
  status: ComponentStatus;
  notes: string | null;
};

export async function GET(
  request: Request,
  { params }: { params: { carId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 });
  }

  try {
    const { carId } = params;

    // 2. ВЫЗЫВАЕМ КАЛЬКУЛЯТОР и получаем массив с реальными, рассчитанными статусами
    const realStates = await calculateComponentStates(carId);
    
    // 3. Отдаем реальные данные на фронтенд
    return NextResponse.json(realStates);
  } catch (error) {
    console.error(`Ошибка при получении состояний компонентов для авто ${params.carId}:`, error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}