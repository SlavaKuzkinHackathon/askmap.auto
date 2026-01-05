// components/CookieBanner.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'askmap_cookie_consent';

export default function CookieBanner() {
  // Состояние, которое определяет, показывать баннер или нет
  const [showBanner, setShowBanner] = useState(false);

  // При первой загрузке компонента проверяем localStorage
  useEffect(() => {
    // localStorage доступен только в браузере, поэтому проверка window.
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      // Показываем баннер, только если согласие еще не было дано
      if (consent !== 'true') {
        setShowBanner(true);
      }
    }
  }, []); // Пустой массив зависимостей - выполнить один раз

  const handleAccept = () => {
    // При нажатии на "ОК" сохраняем согласие в localStorage
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    // И скрываем баннер
    setShowBanner(false);
  };

  // Если баннер не нужно показывать, ничего не рендерим
  if (!showBanner) {
    return null;
  }

  return (
    // Контейнер баннера: прижат к низу, поверх всего контента
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 z-50">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-center md:text-left">
          Мы используем файлы cookie для обеспечения работы личного кабинета.
          Продолжая использовать сайт, вы соглашаетесь с нашей{' '}
          <Link href="/privacy" className="font-medium underline hover:text-gray-300">
            Политикой конфиденциальности
          </Link>.
        </p>
        <button 
          onClick={handleAccept}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-sm flex-shrink-0"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}