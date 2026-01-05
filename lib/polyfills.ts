// lib/polyfills.ts

// Эта проверка гарантирует, что мы не пытаемся определить Blob дважды.
if (typeof Blob === 'undefined') {
    // Мы импортируем Blob из встроенного модуля Node.js `buffer`
    // и делаем его глобально доступным.
    const { Blob } = require('buffer');
    (global as any).Blob = Blob;
  }