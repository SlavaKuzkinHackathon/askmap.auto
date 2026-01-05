// app/api/admin/knowledge/export/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/admin/knowledge/export
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    // 1. Выгружаем компоненты (кроме виртуальных зон)
    const components = await prisma.vehicleComponent.findMany({
      where: { NOT: { partCode: { startsWith: 'zone_' } } },
      orderBy: { partCode: 'asc' },
    });

    // 2. Выгружаем правила, связанные с компонентами
    const symptomCauses = await prisma.symptomCause.findMany({
      orderBy: { symptom: 'asc' },
      include: { component: { select: { partCode: true } } },
    });

    // 3. Форматируем правила для экспорта
    const knowledgeToExport = symptomCauses.map(cause => ({
      symptom: cause.symptom,
      location: cause.location,
      condition: cause.condition,
      baseWeight: cause.baseWeight,
      componentPartCode: cause.component.partCode,
    }));

    // 4. Собираем все в один объект
    const exportData = {
      components: components,
      knowledgeBase: knowledgeToExport,
    };

    // 5. Возвращаем как JSON-файл для скачивания
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const headers = new Headers();
    const timestamp = new Date().toISOString().slice(0, 10); // Формат YYYY-MM-DD
    headers.append('Content-Disposition', `attachment; filename="askmap_knowledge_${timestamp}.json"`);
    headers.append('Content-Type', 'application/json');

    return new NextResponse(blob, { status: 200, statusText: 'OK', headers });

  } catch (error) {
    console.error("Ошибка при экспорте Базы Знаний:", error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}