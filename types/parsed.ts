// types/parsed.ts
// Этот файл содержит TypeScript-типы для данных, которые мы извлекаем из документов.
// Использование типов помогает избежать ошибок и делает код более читаемым.

// Описывает одну позицию (работу или товар) в чеке/заказ-наряде
export type ParsedItem = {
    raw: string;           // Исходный текст строки, например, "Фильтр масляный MANN"
    componentSlug?: string; // Найденный slug компонента, например, "oil_filter"
    confidence?: number;    // Уверенность в правильности сопоставления (0..1)
  };
  
  // Описывает весь распознанный документ
  export type ParsedDocumentV1 = {
    version: '1.0';
    kind: 'receipt' | 'work_order' | 'odometer' | 'other';
    date?: string;             // Дата в формате ISO: "2025-08-10"
    total?: number;            // Общая сумма, например, 4500.00
    currency?: 'RUB' | 'USD' | 'EUR';
    merchant?: string;         // Название СТО или магазина, например, "СТО АвтоМир"
    odometer?: number;         // Пробег, например, 132400
    items?: ParsedItem[];      // Массив распознанных позиций
    note?: string;             // Дополнительные заметки
    meta?: {
      ocrProvider?: 'yandex' | 'google' | 'tesseract'; // Какой OCR-сервис использовался
      language?: string;       // "ru"
    };
  };