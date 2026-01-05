// app/(main)/diagnostics/results/page.tsx
 "use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { getSymptomCodeName } from "@/lib/helpers";

type DiagnosticResult = {
  componentName: string;
  probability: number;
  explanation: string;
};

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [queryText, setQueryText] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // --- ВОЗВРАЩАЕМ СТАРУЮ, РАБОЧУЮ ЛОГИКУ ---
        const symptom = searchParams.get("symptom");
        const location = searchParams.get("location") || null;
        const condition = searchParams.get("condition") || null;
        const originalText = searchParams.get("originalText"); // originalText нам все еще нужен

        setQueryText(originalText || "");

        if (!symptom) {
          throw new Error("Не указан основной симптом.");
        }

        const response = await fetch("/api/diagnostics/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Отправляем старый, правильный объект
          body: JSON.stringify({ symptom, location, condition, originalText }),
        });
        // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Ошибка при анализе");

        setResults(data.results);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Произошла неизвестная ошибка"
        );
        toast.error(err instanceof Error ? err.message : "Произошла ошибка");
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="text-center p-12">
        <h2 className="text-2xl font-semibold">Анализируем ваш запрос...</h2>
        <p className="text-gray-500">Это может занять несколько секунд.</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-12 text-red-500">Ошибка: {error}</div>;
  }

  return (
    <div className="bg-white py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Результаты диагностики
        </h1>

        {/* --- 4. Отображаем переведенный текст запроса --- */}
        <p className="text-gray-500 mb-6">
          По вашему запросу «
          <span className="font-semibold text-gray-700">{queryText}</span>», вот
          наиболее вероятные причины:
        </p>

        <div className="space-y-4">
          {results.length > 0 ? (
            results.map((result, index) => (
              <div key={index} className="p-4 border rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold">
                  {result.componentName}
                </h2>
                <p className="text-sm font-bold text-emerald-600">
                  Вероятность: {result.probability}%
                </p>
                <p className="mt-2 text-gray-700">{result.explanation}</p>
              </div>
            ))
          ) : (
            <div className="p-4 border border-dashed rounded-lg text-center text-gray-500">
              <p>К сожалению, по вашему запросу не найдено вероятных причин.</p>
              <p className="text-xs mt-1">
                Попробуйте вернуться назад и описать проблему иначе.
              </p>
            </div>
          )}
        </div>

        {!session?.user && results.length > 0 && (
          <div className="mt-12 p-6 bg-gray-100 border-t-4 border-emerald-500 rounded-b-lg text-center">
            <h3 className="text-xl font-bold">
              Понравилось? Сохраните результат!
            </h3>
            <p className="mt-2 text-gray-600">
              Зарегистрируйтесь бесплатно, чтобы сохранить этот диагноз в
              историю вашего автомобиля, получать скидки от партнеров и доступ к
              другим функциям.
            </p>
            {/* ИСПРАВЛЕНА ССЫЛКА */}
            <Link
              href="/register"
              className="mt-4 inline-block btn-primary px-8 py-3"
            >
              Создать аккаунт (это быстро)
            </Link>
          </div>
        )}
        <div className="mt-8 text-ls text-red-700 text-center">
          <p>Важный момент: Онлайн-оценка не заменяет диагностику на СТО.</p>
        </div>
      </div>
    </div>
  );
}
