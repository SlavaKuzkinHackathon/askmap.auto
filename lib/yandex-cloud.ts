// lib/yandex-cloud.ts
// Финальная версия. Прямой REST API запрос с API-ключом.

// Проверяем, что все переменные на месте
if (!process.env.YANDEX_FOLDER_ID || !process.env.YANDEX_API_SECRET_KEY) {
  throw new Error("Yandex Cloud environment variables are not set!");
}

/**
 * Функция для отправки запроса в YandexGPT через REST API с API-ключом
 * @param systemPrompt - Системный промпт
 * @param userQuery - Запрос пользователя
 * @returns Строка с JSON-ответом от модели
 */
export async function queryYandexGPT(systemPrompt: string, userQuery: string): Promise<string> {
  try {
    const apiKey = process.env.YANDEX_API_SECRET_KEY!;
    const folderId = process.env.YANDEX_FOLDER_ID!;

    const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Главное отличие: аутентификация через `Api-Key`, а не `Bearer`
        'Authorization': `Api-Key ${apiKey}`,
      },
      body: JSON.stringify({
        modelUri: `gpt://${folderId}/yandexgpt-lite`,
        completionOptions: {
          stream: false,
          temperature: 0.1,
          maxTokens: '2000',
        },
        messages: [
          { role: 'system', text: systemPrompt },
          { role: 'user', text: userQuery },
        ],
      }),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error("Ошибка от API YandexGPT:", errorBody);
        throw new Error(`Запрос к API YandexGPT провалился со статусом ${response.status}`);
    }

    const data = await response.json();
    const content = data.result?.alternatives[0]?.message?.text || '';
    return content;

  } catch (error) {
    console.error("Ошибка при вызове YandexGPT:", error);
    throw new Error("Не удалось получить ответ от YandexGPT");
  }
}