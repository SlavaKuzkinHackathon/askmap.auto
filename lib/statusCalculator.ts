// lib/statusCalculator.ts
import prisma from '@/lib/prisma';
import { ComponentStatus, ServiceRecord, VehicleComponent } from '@prisma/client';
import type { ComponentStateInfo } from '@/app/api/cars/[carId]/component-states/route';

// Пороговые значения для определения статуса по % износа ресурса
const PROGRESS_THRESHOLDS = {
  CRITICAL: 1.0,  // 100% ресурса и более
  ATTENTION: 0.8, // 80% ресурса
};

/**
 * Главная функция, которая рассчитывает состояния всех компонентов для автомобиля,
 * у которых есть заданный ресурс.
 * @param carId - ID автомобиля
 * @returns Массив объектов с информацией о состоянии каждого компонента
 */
export async function calculateComponentStates(carId: string): Promise<ComponentStateInfo[]> {
  // 1. Получаем последний известный пробег и текущую дату
  const lastOdometer = await prisma.odometerReading.findFirst({
    where: { carId },
    orderBy: { date: 'desc' },
  });
  
  const currentMileage = lastOdometer?.value;
  const currentDate = new Date();

  // Если нет данных о пробеге, мы не можем ничего рассчитать
  if (!currentMileage) {
    console.log(`Для авто ${carId} нет данных о пробеге, расчет невозможен.`);
    return [];
  }

  // 2. Находим все компоненты, для которых в принципе возможен расчет (есть ресурс)
  const trackableComponents = await prisma.vehicleComponent.findMany({
    where: {
      OR: [
        { lifespanKm: { not: null } },
        { lifespanMonths: { not: null } },
      ],
    },
  });

  const componentStates: ComponentStateInfo[] = [];

  // 3. Для каждого такого компонента рассчитываем его индивидуальный статус
  for (const component of trackableComponents) {
    // Находим последнюю запись о замене/ремонте этого компонента для данного авто
    const lastService = await prisma.serviceRecord.findFirst({
      where: {
        carId,
        components: { some: { id: component.id } },
      },
      orderBy: { date: 'desc' },
    });
    
    // Если по этому компоненту никогда не было работ, мы не можем рассчитать статус
    if (!lastService) continue;

    // --- НАЧАЛО ЛОГИКИ РАСЧЕТА ---
    let status: ComponentStatus = ComponentStatus.OK;
    let notes: string | null = "Ресурс в норме.";
    
    // Определяем, какой ресурс использовать: уточненный из записи или по умолчанию из справочника
    const lifespanKm = lastService.installedPartLifespanKm || component.lifespanKm;
    const lifespanMonths = lastService.installedPartLifespanMonths || component.lifespanMonths;
    
    const lastServiceMileage = lastService.mileage;
    const lastServiceDate = lastService.date;

    let progressKm = 0;
    if (lifespanKm && lastServiceMileage) {
      const mileagePassed = currentMileage - lastServiceMileage;
      progressKm = mileagePassed > 0 ? mileagePassed / lifespanKm : 0;
    }

    let progressMonths = 0;
    if (lifespanMonths && lastServiceDate) {
      const monthsPassed = (currentDate.getTime() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44); // ~мес.
      progressMonths = monthsPassed > 0 ? monthsPassed / lifespanMonths : 0;
    }

    // Берем максимальный (худший) износ по пробегу или по времени
    const progress = Math.max(progressKm, progressMonths);

    if (progress >= PROGRESS_THRESHOLDS.CRITICAL) {
      status = ComponentStatus.CRITICAL;
      notes = `Ресурс исчерпан! Рекомендуется срочная замена.`;
    } else if (progress >= PROGRESS_THRESHOLDS.ATTENTION) {
      status = ComponentStatus.ATTENTION;
      notes = `Ресурс подходит к концу. Рекомендуется плановая замена.`;
    }
    
    // TODO: Здесь будет проверка ручных корректировок из `CarComponentState`
    
    componentStates.push({
      slug: component.slug,
      name: component.name,
      status,
      notes,
    });
  }

  return componentStates;
}