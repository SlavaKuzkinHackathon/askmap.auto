// app/(admin)/admin/page.tsx
import prisma from "@/lib/prisma";

async function getStats() {
  const [userCount, carCount, recordCount, componentCount] = await Promise.all([
    prisma.user.count(),
    prisma.car.count(),
    prisma.serviceRecord.count(),
    prisma.vehicleComponent.count(),
  ]);
  return { userCount, carCount, recordCount, componentCount };
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
      <p className="text-3xl font-bold mt-2 text-gray-800">{value.toLocaleString('ru-RU')}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Дашборд</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Пользователи" value={stats.userCount} />
        <StatCard title="Автомобили" value={stats.carCount} />
        <StatCard title="Записи в истории" value={stats.recordCount} />
        <StatCard title="Компоненты" value={stats.componentCount} />
      </div>
    </div>
  );
}