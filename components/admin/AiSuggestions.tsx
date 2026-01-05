// components/admin/AiSuggestions.tsx
"use client";

import { getSymptomCodeName } from "@/lib/helpers";

export type Suggestion = {
  symptom: string;
  location: string | null;
  condition: string | null;
  componentName: string;
  confidence: number;
  contextText: string;
};

interface Props {
  suggestions: Suggestion[];
  onAccept: (suggestion: Suggestion) => void;
  onClose: () => void;
}

export default function AiSuggestions({ suggestions, onAccept, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
        <button onClick={onClose} className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-800">&times;</button>
        <h2 className="text-xl font-semibold">Предложения от AI-ассистента</h2>
        <p className="text-sm text-gray-500 mt-1">Проверьте и примите подходящие правила для добавления в Базу Знаний.</p>

        {suggestions.length > 0 ? (
          <div className="mt-4 space-y-4">
            {suggestions.map((s, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 border rounded-md p-4 bg-gray-50">
                <div className="col-span-2">
                  <p><strong>Симптом:</strong> {getSymptomCodeName(s.symptom)}</p>
                  <p><strong>Локация:</strong> {s.location || 'Не указана'}</p>
                  <p><strong>Условие:</strong> {s.condition || 'Не указано'}</p>
                  <p><strong>Причина:</strong> <span className="font-bold text-emerald-700">{s.componentName}</span></p>
                  <p><strong>Уверенность AI:</strong> {Math.round(s.confidence * 100)}%</p>
                </div>
                <div className="flex flex-col justify-between items-end">
                  <div className="text-xs text-gray-500 italic border-l-2 pl-2">"{s.contextText}"</div>
                  <button onClick={() => onAccept(s)} className="btn-primary mt-2">
                    Принять и отредактировать
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-center text-gray-600">AI не смог найти подходящих правил на этой странице.</p>
        )}
      </div>
    </div>
  );
}