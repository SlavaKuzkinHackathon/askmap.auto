// app/(main)/diagnostics/page.tsx
import QueryForm from "@/components/diagnostics/QueryForm";

export const metadata = {
  title: 'Онлайн-диагностика | AskMap',
};

export default function DiagnosticsPage() {
  return (
    <div className="bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800">ASK-Диагност</h1>
          <p className="mt-4 text-lg text-gray-600">
            Опишите проблему своими словами, и наш интеллектуальный помощник
            попробует определить возможные причины неисправности.
          </p>
        </div>

        {/* Форма для ввода симптомов будет здесь */}
        <QueryForm />
      </div>
    </div>
  );
}