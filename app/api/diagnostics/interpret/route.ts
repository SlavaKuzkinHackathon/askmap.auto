import { NextResponse } from 'next/server';
import { z } from 'zod';
import { queryYandexGPT } from '@/lib/yandex-cloud';

const interpretSchema = z.object({
  text: z.string().min(3, "Запрос слишком короткий"),
});

// --- НОВЫЙ, УМНЫЙ ПРОМПТ ---
const systemPrompt = `
Ты — AI-аналитик автомобильных запросов. Твоя задача — извлечь из короткого текста пользователя каноничный симптом и все ключевые слова.

ПРАВИЛА:
1.  Твой ответ — ТОЛЬКО JSON-объект. Без markdown и пояснений.
2.  Схема: {"symptom": "ОДНО_ИЗ_СПИСКА", "keywords": ["слово1", "слово2"]}
3.  "symptom": Нормализуй основной симптом до одного из этих значений: KNOCK, VIBRATION, SQUEAK, NOISE, SMELL, LEAK, WARNING_LIGHT, STARTING_ISSUE, POWER_LOSS.
4.  "keywords": Извлеки из текста ВСЕ значимые слова (существительные, глаголы, прилагательные), связанные с проблемой. Приведи их к нижнему регистру и начальной форме.

ИНТЕРПРЕТАЦИЯ СЛЕНГА:
- "Троит", "не тянет" -> symptom: POWER_LOSS.
- "Воет", "гудит", "шумит" -> symptom: NOISE.
- "Скрипит", "пищит" -> symptom: SQUEAK.

ПРИМЕРЫ:
Вход: "гул в коробке на холодную"
Выход: {"symptom": "NOISE", "keywords": ["гул", "коробка", "холодную"]}

Вход: "троит мотор"
Выход: {"symptom": "POWER_LOSS", "keywords": ["троит", "мотор", "двигатель"]}
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = interpretSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }

    const { text } = validation.data;
    const gptResponse = await queryYandexGPT(systemPrompt, text);

    const jsonMatch = gptResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) { throw new Error("Ответ от AI не содержит JSON."); }
    
    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    // Добавляем исходный текст в ответ, он нам понадобится на следующих шагах
    parsedResponse.originalText = text;

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Ошибка в /api/diagnostics/interpret:', error);
    const errorMessage = error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


/*

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { queryYandexGPT } from '@/lib/yandex-cloud';

const interpretSchema = z.object({
  text: z.string().min(3, "Запрос слишком короткий"),
});

const systemPrompt = `
Ты — продвинутый модуль извлечения признаков "ASK-Диагност". Твоя задача — внимательно проанализировать ВЕСЬ текст автовладельца и извлечь из него три ключевых признака: основной симптом, местоположение и условие.

Твой мыслительный процесс должен быть таким:
1.  Проанализируй текст на наличие специфического сленга.
2.  Какой основной СИМПТОМ описывается?
3.  Где именно (МЕСТО) это происходит?
4.  При каком УСЛОВИИ это происходит?
5.  Сформируй финальный JSON.

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
- ОТВЕТ ДОЛЖЕН БЫТЬ ТОЛЬКО ВАЛИДНЫМ JSON ОБЪЕКТОМ И НИЧЕМ БОЛЬШЕ.
- Схема: {"symptom": "ОДНО_ИЗ_СПИСКА", "location": "строка|null", "condition": "строка|null"}
- Список symptom: "KNOCK", "VIBRATION", "SQUEAK", "NOISE", "SMELL", "LEAK", "WARNING_LIGHT", "STARTING_ISSUE", "POWER_LOSS".

ИНТЕРПРЕТАЦИЯ СЛЕНГА:
- "Троит двигатель" почти всегда означает {"symptom": "POWER_LOSS", "condition": "троение двигателя"}.
- "Не заводится" или "плохо заводится" — это "STARTING_ISSUE".
- "Горит чек" или "check engine" — это "WARNING_LIGHT".

ПРИМЕРЫ ДЛЯ ОБУЧЕНИЯ:
Вход: "потеря мощности двигатель троит"
Выход: {"symptom": "POWER_LOSS", "location": null, "condition": "троение двигателя"}

Вход: "вибрация по всему кузову на скорости выше 80"
Выход: {"symptom": "VIBRATION", "location": "по всему кузову", "condition": "на скорости выше 80 км/ч"}
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = interpretSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }

    const { text } = validation.data;
    const gptResponse = await queryYandexGPT(systemPrompt, text);

    const jsonMatch = gptResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Ответ от AI не содержит JSON.");
    }
    
    const jsonString = jsonMatch[0];
    const parsedResponse = JSON.parse(jsonString);

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Ошибка в /api/diagnostics/interpret:', error);
    const errorMessage = error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
*/