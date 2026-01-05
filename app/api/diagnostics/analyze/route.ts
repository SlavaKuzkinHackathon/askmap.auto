import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { queryYandexGPT } from "@/lib/yandex-cloud";
import { SymptomCode, Prisma, SymptomCause } from "@prisma/client";

// Схема входных данных от interpret/results - не меняется
const analyzeSchema = z.object({
  symptom: z.nativeEnum(SymptomCode),
  location: z.string().nullable(),
  condition: z.string().nullable(),
  originalText: z.string(), // Добавляем originalText
});

// Промпт для объяснений - не меняется
const explanationSystemPrompt = `...`;

// --- НОВЫЙ ПРОМПТ ДЛЯ ОБОГАЩЕНИЯ КЛЮЧЕВЫХ СЛОВ ---
const enrichmentPrompt = `
Ты — AI-лингвист, эксперт по автомобильному сленгу. Твоя задача — расширить и обогатить "сырые" слова синонимами и связанными по смыслу терминами.

ПРАВИЛА:
1.  Твой ответ — ТОЛЬКО JSON-объект. Без markdown и пояснений.
2.  Схема: {"enrichedKeywords": ["слово1", "синоним1", "термин1"]}
3.  "enrichedKeywords": Сгенерируй массив, включающий ИСХОДНЫЕ слова и 3-5 релевантных синонимов или связанных технических терминов. Все слова в нижнем регистре.

ПРИМЕРЫ:
Вход: "коробас воет"
Выход: {"enrichedKeywords": ["коробас", "воет", "коробка", "трансмиссия", "акпп", "кпп", "гул"]}

Вход: "шум колеса"
Выход: {"enrichedKeywords": ["шум", "колесо", "колеса", "ступица", "подвеска", "шина", "гул"]}
`;

const getSymptomCodeName = (code: SymptomCode | string): string => {
  const map: Record<SymptomCode, string> = {
    KNOCK: "Стук", VIBRATION: "Вибрация", SQUEAK: "Скрип", NOISE: "Шум", SMELL: "Запах",
    LEAK: "Утечка", WARNING_LIGHT: "Индикатор на панели", STARTING_ISSUE: "Проблема с запуском",
    POWER_LOSS: "Потеря мощности",
  };
  return map[code] || code;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = analyzeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }
    const { symptom, location, condition, originalText } = validation.data;

    // --- НАЧАЛО НОВОЙ ЛОГИКИ "ГИБРИДА" ---

    // ЭТАП 1: Обогащение через AI
    let keywords: string[] = [];
    try {
      const gptResponse = await queryYandexGPT(enrichmentPrompt, originalText);
      const jsonMatch = gptResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.enrichedKeywords && Array.isArray(parsed.enrichedKeywords)) {
          keywords = parsed.enrichedKeywords;
        }
      }
    } catch (e) {
      console.error("Ошибка обогащения ключевых слов:", e);
    }
    // Если AI не справился, используем "сырые" данные как запасной вариант
    if (keywords.length === 0) {
      if (location) keywords.push(...location.toLowerCase().split(' '));
      if (condition) keywords.push(...condition.toLowerCase().split(' '));
    }
    console.log(`Обогащенные ключевые слова для поиска: [${keywords.join(', ')}]`);


    // ЭТАП 2: "Широкая" выборка из нашей базы
    const candidateCauses = await prisma.symptomCause.findMany({
      where: { symptom: symptom },
      include: { component: { select: { name: true } } },
    });

    if (candidateCauses.length === 0) {
      return NextResponse.json({ results: [], disclaimer: "..." });
    }

    // ЭТАП 3: Ранжирование по ключевым словам (наш надежный алгоритм)
    const scoredCauses = candidateCauses.map(cause => {
      let score = 0;
      // Собираем ВСЕ слова из правила в одну строку для поиска
      const ruleText = `${cause.location || ''} ${cause.condition || ''} ${cause.component.name}`.toLowerCase();

      keywords.forEach(keyword => {
        if (keyword.length > 2 && ruleText.includes(keyword)) {
          score++;
        }
      });
      return { ...cause, finalScore: score + cause.baseWeight };
    });

    const rankedCauses = scoredCauses
      .filter(c => c.finalScore > c.baseWeight)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 9);
      
    // --- КОНЕЦ НОВОЙ ЛОГИКИ ---

    if (rankedCauses.length === 0) {
      return NextResponse.json({ results: [], disclaimer: "К сожалению, по вашему запросу не найдено вероятных причин. Попробуйте описать проблему иначе." });
    }

    const resultsWithExplanations = await Promise.all(
      rankedCauses.map(async (cause) => {
        const userInputForExplanation = `Деталь: "${cause.component.name}", Симптом: "${getSymptomCodeName(cause.symptom)}"`;
        const explanation = await queryYandexGPT(explanationSystemPrompt, userInputForExplanation);
        return {
          componentName: cause.component.name,
          probability: Math.round(cause.baseWeight * 100),
          explanation: explanation.trim(),
        };
      })
    );

    const finalResponse = {
      results: resultsWithExplanations,
      disclaimer: "Онлайн-оценка не заменяет диагностику на СТО...",
    };

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error("Ошибка в /api/diagnostics/analyze:", error);
    const errorMessage = error instanceof Error ? error.message : "Внутренняя ошибка сервера";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/*
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { queryYandexGPT } from "@/lib/yandex-cloud";
import { SymptomCode, Prisma, SymptomCause } from "@prisma/client";

const analyzeSchema = z.object({
  symptom: z.nativeEnum(SymptomCode),
  keywords: z.array(z.string()),
  originalText: z.string(),
});

const explanationSystemPrompt = `
Ты — опытный и дружелюбный автомеханик-наставник. Твоя задача — объяснить сложное простыми словами, как будто ты разговариваешь с другом в гараже.
Я дам тебе название автомобильной детали и симптом.
Сгенерируй короткое (2-3 предложения), простое и понятное объяснение.
Объясни, что это за деталь, какова ее роль, и почему ее износ может вызывать именно этот симптом.
НЕ используй сложные технические термины. Говори просто.
Отвечай ТОЛЬКО сгенерированным текстом объяснения. Без приветствий и заголовков.
`;

const getSymptomCodeName = (code: SymptomCode | string): string => {
  const map: Record<SymptomCode, string> = {
    KNOCK: "Стук", VIBRATION: "Вибрация", SQUEAK: "Скрип", NOISE: "Шум", SMELL: "Запах",
    LEAK: "Утечка", WARNING_LIGHT: "Индикатор на панели", STARTING_ISSUE: "Проблема с запуском",
    POWER_LOSS: "Потеря мощности",
  };
  return map[code] || code;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = analyzeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }
    const { symptom, keywords } = validation.data;

    // --- 2. НОВАЯ ЛОГИКА ПОИСКА И РАНЖИРОВАНИЯ ---

    // "Широкая" выборка: загружаем ВСЕ правила для данного симптома.
    const candidateCauses = await prisma.symptomCause.findMany({
      where: { symptom: symptom },
      include: { component: { select: { name: true } } },
    });

    if (candidateCauses.length === 0) {
      return NextResponse.json({ results: [], disclaimer: "..." });
    }

    // "Умное" ранжирование по ключевым словам (как в админке).
    const scoredCauses = candidateCauses.map(cause => {
      let score = 0;
      const ruleText = `${cause.location || ''} ${cause.condition || ''}`.toLowerCase();

      // Если у пользователя нет ключевых слов, оцениваем только общие правила.
      if (keywords.length === 0) {
        if (!cause.location && !cause.condition) {
          score = 1;
        }
      } else {
        // Начисляем очки за каждое совпавшее ключевое слово.
        keywords.forEach(keyword => {
          if (keyword.length > 2 && ruleText.includes(keyword)) {
            score++;
          }
        });
      }
      
      return { ...cause, finalScore: score + cause.baseWeight };
    });

    // Фильтруем (оставляем только те, где есть хоть какие-то совпадения) и сортируем.
    const rankedCauses = scoredCauses
      .filter(c => c.finalScore > c.baseWeight)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 9);

    if (rankedCauses.length === 0) {
      return NextResponse.json({ results: [], disclaimer: "К сожалению, по вашему запросу не найдено вероятных причин. Попробуйте описать проблему иначе." });
    }
    // --- КОНЕЦ НОВОЙ ЛОГИКИ ---

    const resultsWithExplanations = await Promise.all(
      rankedCauses.map(async (cause) => {
        const userInputForExplanation = `Деталь: "${cause.component.name}", Симптом: "${getSymptomCodeName(cause.symptom)}"`;
        const explanation = await queryYandexGPT(explanationSystemPrompt, userInputForExplanation);
        return {
          componentName: cause.component.name,
          probability: Math.round(cause.baseWeight * 100),
          explanation: explanation.trim(),
        };
      })
    );

    const finalResponse = {
      results: resultsWithExplanations,
      disclaimer: "Онлайн-оценка не заменяет диагностику на СТО...",
    };

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error("Ошибка в /api/diagnostics/analyze:", error);
    const errorMessage = error instanceof Error ? error.message : "Внутренняя ошибка сервера";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


*/