import '@/lib/polyfills';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { queryYandexGPT } from '@/lib/yandex-cloud';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SymptomCode } from '@prisma/client';

const urlSchema = z.object({
  url: z.string().url("Необходимо указать корректный URL"),
});

const systemPrompt = `
Ты — AI-аналитик проекта AskMap. Твоя единственная задача — извлечь из текста автомобильного форума структурированные правила "симптом-причина".

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА ТВОЕЙ РАБОТЫ:
1.  ТВОЙ ОТВЕТ — ЭТО ВСЕГДА ТОЛЬКО JSON-МАССИВ. Никаких приветствий, извинений, объяснений, советов или итоговых саммари. Только JSON-массив, даже если он пустой.
2.  НЕ ПРИДУМЫВАЙ. Если в тексте нет явного указания на то, что замена конкретной детали решила конкретную проблему, не создавай правило.
3.  ЕСЛИ ПРАВИЛ НЕ НАЙДЕНО, верни пустой массив: []. НЕ ПИШИ ТЕКСТ.

СТРУКТУРА ОБЪЕКТА ВНУТРИ МАССИВА (СТРОГО):
{"symptom": "ОДНО_ИЗ_СПИСКА", "location": "строка|null", "condition": "строка|null", "componentName": "Название детали", "confidence": число_от_0_до_1, "contextText": "Цитата_с_форума"}

ПОЛЯ:
- symptom: Код симптома из этого списка: ${Object.values(SymptomCode).join(', ')}.
- componentName: Каноничное название детали (напр., "Стойка стабилизатора", а не "косточка" или "яйца").
- confidence: Твоя оценка уверенности в правиле от 0.0 до 1.0. Ставь высокую оценку ( > 0.8), только если в тексте есть прямое подтверждение "была проблема -> поменял деталь -> проблема ушла".
- contextText: Ключевая цитата из текста, подтверждающая твой вывод (не более 200 символов).

ПРИМЕР ХОРОШЕГО КЕЙСА:
Входной текст: "...у меня на солярисе на мелких кочках спереди что-то брякало, все облазил, в итоге поменял стойки стаба и тишина..."
Твой JSON-ответ:
[
  {
    "symptom": "KNOCK",
    "location": "спереди",
    "condition": "на мелких кочках",
    "componentName": "Стойка стабилизатора",
    "confidence": 0.95,
    "contextText": "в итоге поменял стойки стаба и тишина"
  }
]

ПРИМЕР ПЛОХОГО КЕЙСА (когда нужно вернуть пустой массив):
Входной текст: "...у меня стучит спереди, грешу на шаровую, но пока не менял, денег нет..."
Твой JSON-ответ:
[]
`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = urlSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.format() }, { status: 400 });
    }
    const { url } = validation.data;

    let response;
    try {
      response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
    } catch (fetchError) {
      throw new Error("Не удалось получить доступ к странице. Возможно, она требует авторизации или недоступна.");
    }

    if (!response.ok) {
      throw new Error(`Не удалось загрузить страницу. Статус: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let html: string;
    if (contentType.includes('windows-1251')) {
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('windows-1251');
      html = decoder.decode(buffer);
    } else {
      html = await response.text();
    }
    
    const $ = cheerio.load(html);
    const contentSelectors = [['.c-post__body', '.c-comment__message'], ['.message-content .post-text'], ['article'], ['main']];
    let pageText = '';
    for (const selectors of contentSelectors) {
      let found = false;
      selectors.forEach(selector => {
        if ($(selector).length > 0) {
          found = true;
          $(selector).each((i, elem) => { pageText += $(elem).text() + ' \n '; });
        }
      });
      if (found) { break; }
    }
    
    if (!pageText) {
      $('script, style, nav, footer, header, form, button, input').remove();
      pageText = $('body').text();
    }
    pageText = pageText.replace(/\s\s+/g, ' ').trim();
    
    if (pageText.length < 100) {
      throw new Error("На странице слишком мало релевантного текста для анализа.");
    }
    
    const gptResponse = await queryYandexGPT(systemPrompt, pageText.slice(0, 7000));
    
    // --- НАЧАЛО ИСПРАВЛЕНИЯ: Самый надежный парсер ---

    // 1. Находим первую открывающую скобку [
    const startIndex = gptResponse.indexOf('[');
    // 2. Находим последнюю закрывающую скобку ]
    const endIndex = gptResponse.lastIndexOf(']');

    // 3. Проверяем, что обе скобки найдены и стоят в правильном порядке
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        throw new Error("AI не вернул ответ, не содержащий JSON-массив. Ответ AI: " + gptResponse.slice(0, 200));
    }

    // 4. Вырезаем "чистый" JSON из строки.
    const jsonString = gptResponse.substring(startIndex, endIndex + 1);

    try {
        // 5. Пробуем распарсить.
        const parsedSuggestions = JSON.parse(jsonString);
        return NextResponse.json({ suggestions: parsedSuggestions });
    } catch (parseError) {
        // Если даже вырезанная строка не парсится, значит JSON "битый".
        console.error("Не удалось распарсить извлеченный JSON:", parseError);
        throw new Error("AI вернул некорректный JSON. Извлеченная строка: " + jsonString.slice(0, 200));
    }
    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

  } catch (error) {
    console.error("Ошибка в parse-url:", error);
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}