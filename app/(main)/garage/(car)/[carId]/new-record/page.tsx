// app/garage/(car)/[carId]/new-record/page.tsx

import Link from 'next/link';
import prisma from "@/lib/prisma";
import ManualRecordForm from "@/components/ManualRecordForm";
import { Car } from '@prisma/client';

// Отдельная небольшая функция для получения данных только об авто
async function getCarData(carId: string): Promise<Car | null> {
    try {
        const car = await prisma.car.findUnique({ where: { id: carId } });
        return car;
    } catch (error) {
        console.error("Ошибка при получении данных об авто для формы:", error);
        return null;
    }
}

export default async function NewRecordPage({ params }: { params: { carId: string } }) {
    const { carId } = params;
    const car = await getCarData(carId);

    // Если по какой-то причине авто не найдено, показываем ошибку
    if (!car) {
        return (
            <div className="container mx-auto p-4 text-center">
              <h1 className="text-2xl font-bold text-red-600">Ошибка 404</h1>
              <p className="mt-2 text-gray-600">Автомобиль для добавления записи не найден.</p>
              <Link href="/garage" className="mt-4 inline-block text-blue-600 hover:underline">
                &larr; Вернуться в гараж
              </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl"> {/* Ограничиваем ширину для удобства */}
            {/* --- Заголовок страницы --- */}
            <div className="mb-8">
                <Link href={`/garage/${carId}`} className="text-sm text-blue-600 hover:underline mb-2 inline-block">
                    &larr; Назад к автомобилю
                </Link>
                <h1 className="text-3xl font-bold">Новая запись</h1>
                <p className="text-gray-500 mt-1">
                    для {car.make} {car.model} ({car.year})
                </p>
            </div>

            {/* --- Компонент формы --- */}
            <ManualRecordForm carId={carId} serviceTypes={[]} />
        </div>
    );
}