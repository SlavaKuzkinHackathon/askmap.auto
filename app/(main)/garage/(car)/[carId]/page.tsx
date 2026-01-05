// app/garage/(car)/[carId]/page.tsx

import Link from 'next/link';
import prisma from "@/lib/prisma";
import { Car, ServiceRecord, ServiceType } from '@prisma/client';

import ServiceHistoryList from '@/components/ServiceHistoryList';
import ManualRecordForm from '@/components/ManualRecordForm';
import InteractiveCarMap from '@/components/InteractiveCarMap';

export type SafeServiceRecord = Omit<ServiceRecord, 'cost' | 'date' | 'createdAt' | 'updatedAt'> & {
  cost: number | null;
  date: string | null;
  createdAt: string;
  updatedAt: string;
};

// Функция теперь загружает ТРИ типа данных: авто, его историю и справочник типов работ
async function getPageData(carId: string): Promise<{ car: Car | null; records: SafeServiceRecord[]; serviceTypes: ServiceType[] }> {
  try {
    const [car, records, serviceTypes] = await Promise.all([
      prisma.car.findUnique({ where: { id: carId } }),
      prisma.serviceRecord.findMany({ where: { carId: carId }, orderBy: { date: 'desc' } }),
      
      prisma.serviceType.findMany({ orderBy: { name: 'asc' } }),
    ]);

    if (!car) {
      return { car: null, records: [], serviceTypes: [] };
    }

    const safeRecords = records.map(record => ({
      ...record,
      cost: record.cost ? Number(record.cost) : null,
      date: record.date ? record.date.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    }));
    
    return { car, records: safeRecords, serviceTypes };
  } catch (error) {
    console.error("Ошибка при получении данных для страницы автомобиля:", error);
    return { car: null, records: [], serviceTypes: [] };
  }
}

export default async function CarDetailsPage({ params }: { params: { carId: string } }) {
  const { carId } = params;
  const { car, records, serviceTypes } = await getPageData(carId);

  if (!car) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600">Ошибка 404</h1>
        <p className="mt-2 text-gray-600">Автомобиль с таким ID не найден.</p>
        <Link href="/garage" className="mt-4 inline-block text-blue-600 hover:underline">
          &larr; Вернуться в гараж
        </Link>
      </div>
    );
  }

  const historyVersion = records.map(r => r.updatedAt).join(',');

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <Link href="/garage" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          &larr; Назад в гараж
        </Link>
        <h1 className="text-3xl font-bold">{car.make} {car.model}</h1>
        <p className="text-gray-500 mt-1">
          {car.year} год 
          {car.licensePlate && ` •  ${car.licensePlate}`} 
          {car.vin && ` • VIN: ${car.vin}`}
        </p>
      </div>

      <InteractiveCarMap carId={carId} historyVersion={historyVersion} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          {/* Передаем справочник serviceTypes в компонент списка */}
          <ServiceHistoryList records={records} serviceTypes={serviceTypes} />
        </div>
        <div className="lg:col-span-1">
          {/* Передаем справочник serviceTypes в компонент формы */}
          <ManualRecordForm carId={carId} serviceTypes={serviceTypes} />
        </div>
      </div>
    </div>
  );
}