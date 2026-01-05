"use client";

import { useState } from "react";
import type { SymptomCause, VehicleComponent } from "@prisma/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { useDataTable } from "@/hooks/useDataTable";
import SearchInput from "@/components/admin/SearchInput";
import Pagination from "@/components/admin/Pagination";

import MatchComponentModal from '@/components/admin/MatchComponentModal'; // <-- 1. Импортируем новую модалку
import CauseFormModal from "@/components/admin/CauseFormModal";
import ComponentFormModal from "@/components/admin/ComponentFormModal";
import ParseUrlModal from "@/components/admin/ParseUrlModal";
import AiSuggestions, { Suggestion } from "@/components/admin/AiSuggestions";
import { getSymptomCodeName } from "@/lib/helpers";

type CauseWithComponent = SymptomCause & { component: { name: string } };

// --- ИСПРАВЛЕНИЕ №1: Правильно называем пропсы ---
export default function KnowledgeBaseClientPage({
  allComponents: initialAllComponents, // <-- Деструктурируем и сразу переименовываем
}: {
  initialCauses: CauseWithComponent[];
  allComponents: VehicleComponent[];
}) {
  const [allComponents, setAllComponents] = useState(initialAllComponents);
  const router = useRouter();

  const {
    data: causes, // Переименовываем, чтобы не конфликтовать с твоим старым состоянием
    isLoading,
    pagination,
    setPage,
    searchTerm,
    setSearchTerm,
    refresh,
  } = useDataTable<CauseWithComponent>("/api/admin/symptom-causes");

  // Состояния для управления модальными окнами
  const [isCauseModalOpen, setIsCauseModalOpen] = useState(false);
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
  const [isParseModalOpen, setIsParseModalOpen] = useState(false);

  // Состояния для данных, которые редактируются
  const [editingCause, setEditingCause] = useState<CauseWithComponent | null>(
    null
  );
  const [editingComponent, setEditingComponent] =
    useState<VehicleComponent | null>(null);

  // Состояния для AI-ассистента
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Suggestion[]>([]);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  // Состояние для "запоминания" предложения от AI, пока мы создаем новый компонент
  const [suggestionToProcess, setSuggestionToProcess] =
    useState<Suggestion | null>(null);

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    toast.loading("Экспорт данных...");

    try {
      const response = await fetch("/api/admin/knowledge/export");
      if (!response.ok) {
        throw new Error("Не удалось экспортировать данные");
      }

      // Магия скачивания файла в браузере
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Получаем имя файла из заголовков ответа
      const contentDisposition = response.headers.get("content-disposition");
      let fileName = "askmap_knowledge.json";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+?)"/);
        if (match) fileName = match[1];
      }
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(); // Убираем "загрузку"
      toast.success("Данные успешно экспортированы!");
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Произошла ошибка");
    } finally {
      setIsExporting(false);
    }
  };

  // --- ОБРАБОТЧИКИ СОХРАНЕНИЯ ---

  const handleCauseSave = () => {
    // Убираем аргумент, так как refresh() делает все за нас
    setIsCauseModalOpen(false);
    toast.success("Правило успешно сохранено!");
    refresh(); // <-- Просто вызываем refresh из хука для обновления данных
  };

  const handleComponentSave = (savedComponent: VehicleComponent) => {
    setIsComponentModalOpen(false);
    setAllComponents((prev) => [savedComponent, ...prev]);
    toast.success(`Компонент "${savedComponent.name}" создан!`);
    if (suggestionToProcess) {
      const prefilledData = {
        id: "",
        symptom: suggestionToProcess.symptom as SymptomCause["symptom"],
        location: suggestionToProcess.location,
        condition: suggestionToProcess.condition,
        componentId: savedComponent.id,
        baseWeight: suggestionToProcess.confidence,
        component: { name: savedComponent.name },
      };
      setEditingCause(prefilledData);
      setIsCauseModalOpen(true);
    }
  };

  // --- ОБРАБОТЧИКИ AI-АССИСТЕНТА ---

  const handleAnalyzeUrl = async (url: string) => {
    setIsParsing(true);
    setParseError(null);
    try {
      const response = await fetch("/api/admin/ai-assistant/parse-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка анализа");

      setAiSuggestions(data.suggestions);
      setIsParseModalOpen(false);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setIsParsing(false);
    }
  };

  const handleAcceptSuggestion = (suggestion: Suggestion) => {
    setSuggestionToProcess(suggestion);
    const foundComponent = allComponents.find(c => c.name.toLowerCase() === suggestion.componentName.toLowerCase());

    if (foundComponent) {
      // Сценарий 1: Компонент НАЙДЕН -> все как раньше
      openCauseModalWithPrefill(suggestion, foundComponent.id);
    } else {
      // Сценарий 2: Компонент НЕ НАЙДЕН -> открываем "Модалку Сопоставления"
      setIsMatchModalOpen(true);
    }
  };

  const handleComponentMatchConfirm = (selectedComponentId: string | null) => {
    setIsMatchModalOpen(false);
    if (!suggestionToProcess) return;

    if (selectedComponentId) {
      // Пользователь выбрал СУЩЕСТВУЮЩИЙ компонент
      openCauseModalWithPrefill(suggestionToProcess, selectedComponentId);
    } else {
      // Пользователь выбрал "Создать новый"
      const newComponentData = { name: suggestionToProcess.componentName } as VehicleComponent;
      setEditingComponent(newComponentData);
      setIsComponentModalOpen(true);
    }
  };

  // Вспомогательная функция, чтобы не дублировать код
  const openCauseModalWithPrefill = (suggestion: Suggestion, componentId: string) => {
    const component = allComponents.find(c => c.id === componentId);
    if (!component) return;

    const prefilledData = {
      id: '', symptom: suggestion.symptom as SymptomCause['symptom'],
      location: suggestion.location, condition: suggestion.condition,
      componentId: component.id, baseWeight: suggestion.confidence,
      component: { name: component.name }
    };
    setEditingCause(prefilledData);
    setIsCauseModalOpen(true);
  };

  // --- ОБРАБОТЧИК УДАЛЕНИЯ ---
  const handleDelete = async (cause: CauseWithComponent) => {
    if (!window.confirm(`Вы уверены, что хотите удалить это правило?`)) return;
    try {
      const response = await fetch(`/api/admin/symptom-causes/${cause.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Не удалось удалить правило");
      toast.success("Правило успешно удалено!");
      refresh(); // <-- Используем refresh для обновления
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка удаления");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          База Знаний "ASK-Диагноста"
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Второстепенная кнопка №1 */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            // Стили для второстепенной кнопки, имитирующие стандартный вид
            className="px-5 py-2.5 text-sm font-medium text-center text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-emerald-700 focus:z-10 focus:ring-4 focus:ring-gray-100 disabled:opacity-50 transition-colors"
          >
            {isExporting ? "Экспорт..." : "Выгрузить знания"}
          </button>

          {/* Второстепенная кнопка №2 */}
          <button
            onClick={() => setIsParseModalOpen(true)}
            className="px-5 py-2.5 text-sm font-medium text-center text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-emerald-700 focus:z-10 focus:ring-4 focus:ring-gray-100 disabled:opacity-50 transition-colors"
          >
            Анализировать URL
          </button>

          {/* Главная кнопка, ИСПОЛЬЗУЕТ ТВОЙ СТИЛЬ */}
          <button
            onClick={() => {
              setEditingCause(null);
              setIsCauseModalOpen(true);
            }}
            // Убираем w-full, чтобы кнопка не растягивалась на всю ширину
            className="btn-primary w-auto"
          >
            Добавить правило
          </button>
        </div>
      </div>

      <div className="mb-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Поиск по компоненту, локации, условию..."
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                Симптом
              </th>
              <th scope="col" className="px-6 py-3">
                Локация / Условие
              </th>
              <th scope="col" className="px-6 py-3">
                Компонент-причина
              </th>
              <th scope="col" className="px-6 py-3">
                Вероятность
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-8">
                  Загрузка данных...
                </td>
              </tr>
            ) : causes.length > 0 ? (
              causes.map((cause) => (
                <tr
                  key={cause.id}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {getSymptomCodeName(cause.symptom)}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <div className="font-semibold">
                      {cause.location || "Любая"}
                    </div>
                    <div className="text-gray-400 mt-1">
                      {cause.condition || "Любое"}
                    </div>
                  </td>
                  <td className="px-6 py-4">{cause.component.name}</td>
                  <td className="px-6 py-4 font-mono text-center">
                    {Math.round(cause.baseWeight * 100)}%
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setEditingCause(cause);
                        setIsCauseModalOpen(true);
                      }}
                      className="font-medium text-blue-600 hover:underline mr-4"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(cause)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-8">
                  {searchTerm
                    ? `Ничего не найдено по запросу "${searchTerm}"`
                    : "Правила еще не добавлены."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />

      <ParseUrlModal
        isOpen={isParseModalOpen}
        onClose={() => setIsParseModalOpen(false)}
        onAnalyze={handleAnalyzeUrl}
        isLoading={isParsing}
        error={parseError}
      />

      {aiSuggestions.length > 0 && (
        <AiSuggestions
          suggestions={aiSuggestions}
          onAccept={handleAcceptSuggestion}
          onClose={() => setAiSuggestions([])}
        />
      )}

      {isMatchModalOpen && suggestionToProcess && (
        <MatchComponentModal
          isOpen={isMatchModalOpen}
          onClose={() => setIsMatchModalOpen(false)}
          onConfirm={handleComponentMatchConfirm}
          suggestedName={suggestionToProcess.componentName}
          allComponents={allComponents}
        />
      )}

      <CauseFormModal
        isOpen={isCauseModalOpen}
        onClose={() => setIsCauseModalOpen(false)}
        onSave={handleCauseSave}
        initialData={editingCause}
        components={allComponents}
      />

      <ComponentFormModal
        isOpen={isComponentModalOpen}
        onClose={() => setIsComponentModalOpen(false)}
        onSave={handleComponentSave}
        initialData={editingComponent}
      />
    </div>
  );
}
