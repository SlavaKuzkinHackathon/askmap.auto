// app/garage/new/page.tsx
import NewCarForm from '@/components/NewCarForm';

export default function NewCarPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Добавить новый автомобиль</h1>
      
      <NewCarForm />
    </div>
  );
}