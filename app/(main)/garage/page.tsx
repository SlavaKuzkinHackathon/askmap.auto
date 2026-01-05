// app/garage/page.tsx
import Link from "next/link";
import { Car } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation"; // Импортируем redirect
import prisma from "@/lib/prisma";
import UpdateMileageForm from "@/components/UpdateMileageForm";

// Расширим тип Car, чтобы он включал последние данные о пробеге
type CarWithMileage = Car & {
  lastOdometerReading: { value: number | null; date: Date | null };
};

async function getCarsForUser(userId: string): Promise<CarWithMileage[]> {
  const ownerships = await prisma.ownership.findMany({
    where: { userId, endDate: null },
    include: {
      car: {
        // Включаем последнюю запись о пробеге для каждой машины
        include: {
          odometerReadings: {
            orderBy: { date: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { car: { createdAt: "desc" } },
  });

  // Преобразуем данные в удобный формат
  return ownerships.map((o) => ({
    ...o.car,
    lastOdometerReading: {
      value: o.car.odometerReadings[0]?.value ?? null,
      date: o.car.odometerReadings[0]?.date ?? null,
    },
  }));
}

export default async function GaragePage() {
  const session = await getServerSession(authOptions);

  const cars = await getCarsForUser(session.user.id);

  // Функция для проверки, "устарел" ли пробег (например, прошло > 30 дней)
  const isMileageOutdated = (date: Date | null): boolean => {
    if (!date) return true; // Если даты нет, считаем устаревшим
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate());//-30
    return date < thirtyDaysAgo;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Мой гараж</h1>
        <Link
          href="/garage/new"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          + Добавить автомобиль
        </Link>
      </div>

      {cars.length === 0 ? (
        <p>У вас пока нет добавленных автомобилей.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            // Карточка теперь не обернута в Link целиком
            <div key={car.id} className="p-6 bg-white border ...">
              <Link href={`/garage/${car.id}`}>
                <h2 className="mb-2 text-2xl font-bold ... hover:text-emerald-700">
                  {car.make} {car.model}
                </h2>
              </Link>
              <p className="font-normal text-gray-700">{car.year} год</p>
              <p className="text-sm text-gray-500 mt-2">
                {car.licensePlate || "Номер не указан"}
              </p>
              <p className="font-normal text-gray-700">
              VIN или номер кузова :  {car.vin}
              </p>

              {/* 2. Показываем форму, если пробег устарел */}
              {isMileageOutdated(car.lastOdometerReading.date) && (
                <UpdateMileageForm
                  carId={car.id}
                  lastKnownMileage={car.lastOdometerReading.value}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
