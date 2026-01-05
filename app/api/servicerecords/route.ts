// app/api/servicerecords/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  RecordSource,
  ServiceRecordStatus,
  OdometerSource,
  ServiceType,
} from "@prisma/client";
import { z } from "zod";

// Схема валидации для данных, приходящих от формы
const createManualRecordSchema = z.object({
  carId: z.string().cuid(),
  title: z.string().min(3, "Название не может быть короче 3 символов"),
  mileage: z
    .number()
    .int()
    .positive("Пробег должен быть положительным числом")
    .optional(),
  date: z.string().datetime("Неверный формат даты").optional(),
  cost: z.number().optional(),
  // Ожидаем ID типа работ, а не enum
  serviceTypeId: z.string().cuid("Необходимо выбрать тип работы").optional(),
  installedPartLifespanKm: z.number().int().positive().optional(),
  components: z.array(z.string().cuid()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createManualRecordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.format() },
        { status: 400 }
      );
    }

    // Извлекаем все данные, type здесь больше нет
    const {
      carId,
      title,
      mileage,
      date,
      cost,
      serviceTypeId,
      installedPartLifespanKm,
      components,
    } = validation.data;

    // Если ID типа не передан, найдем ID для "Прочее" как запасной вариант
    let finalServiceTypeId = serviceTypeId;
    if (!finalServiceTypeId) {
      const otherType = await prisma.serviceType.findUnique({
        where: { slug: "other" },
      });
      if (!otherType)
        throw new Error(
          "Тип работ 'Прочее' (slug: 'other') не найден в базе данных. Запустите prisma db seed."
        );
      finalServiceTypeId = otherType.id;
    }

    // Собираем объект для создания записи в БД
    const dataToCreate: any = {
      carId,
      title,
      status: ServiceRecordStatus.CONFIRMED,
      source: RecordSource.MANUAL,
      serviceTypeId: finalServiceTypeId,
    };

    // Условно добавляем необязательные поля
    if (mileage !== undefined) dataToCreate.mileage = mileage;
    if (date !== undefined) dataToCreate.date = new Date(date);
    if (cost !== undefined) dataToCreate.cost = cost;
    if (installedPartLifespanKm !== undefined)
      dataToCreate.installedPartLifespanKm = installedPartLifespanKm;

    if (components && components.length > 0) {
      dataToCreate.components = {
        connect: components.map((id) => ({ id })),
      };
    }

    const newRecord = await prisma.serviceRecord.create({ data: dataToCreate });

    // Если в созданной записи об обслуживании был указан пробег,
    // мы автоматически создаем или обновляем запись о пробеге.
    if (newRecord.mileage) {
      await prisma.odometerReading.create({
        data: {
          carId: newRecord.carId,
          value: newRecord.mileage,
          // Используем дату из записи о ремонте, если она есть, иначе - текущую
          date: newRecord.date || new Date(),
          // Источник - та же ручная запись, которую только что создали
          source: OdometerSource.MANUAL,
        },
      });
      console.log(
        `Создана запись OdometerReading для авто ${newRecord.carId} с пробегом ${newRecord.mileage}`
      );
    }

    return NextResponse.json(newRecord, { status: 201 });
    
  } catch (error) {
    console.error("Ошибка при создании записи:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Внутренняя ошибка сервера";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
