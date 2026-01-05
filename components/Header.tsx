// components/Header.tsx
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Role } from "@/lib/helpers";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Header({ isTransparent = false }: { isTransparent?: boolean }) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === Role.ADMIN;
  
  // 1. СОСТОЯНИЕ ДЛЯ УПРАВЛЕНИЯ МЕНЮ-"БУРГЕРОМ"
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // 2. ЗАКРЫВАЕМ МЕНЮ ПРИ ПЕРЕХОДЕ НА ДРУГУЮ СТРАНИЦУ
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

    // Определяем, что сессия еще в процессе загрузки
    const isLoadingSession = status === 'loading';
  // --- Логика определения стилей (остается без изменений) ---
  const isTrulyTransparent = isTransparent && !isLoadingSession && !user;

  // Если сессия загружается, мы принудительно делаем хедер непрозрачным,
  // чтобы избежать "прыжка" макета.
  const headerClasses = `
    ${isTrulyTransparent ? 'absolute top-0 left-0 right-0 text-white' : 'bg-white shadow-sm text-gray-800 relative'}
    ${isMenuOpen ? 'z-50' : 'z-30'}
  `;
  
  const linkClasses = isTrulyTransparent
    ? "hover:text-gray-300"
    : "text-gray-600 hover:text-emerald-600";

  // --- Отдельный компонент для навигационных ссылок, чтобы не дублировать код ---
  const NavLinks = () => (
    <>
      <Link href="/diagnostics" className={linkClasses}>
        Диагностика
      </Link>
      <Link href="/discounts" className={linkClasses}>
        Скидки
      </Link>
      {user && (
        <>
          <Link href="/garage" className={linkClasses}>
            Мой гараж
          </Link>
          <div className="w-px h-5 bg-gray-200 md:block hidden" />
          <div className="flex items-center gap-2">
            <span
              className={isTrulyTransparent ? "text-white" : "text-gray-800"}
            >
              {user.name || user.email}
            </span>
            {isAdmin && (
              <Link href="/admin" className="text-red-500 hover:underline">
                (Админ)
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className={linkClasses}
            >
              Выйти
            </button>
          </div>
        </>
      )}
      {!user && status !== "loading" && (
        <>
          <Link href="/login" className={linkClasses}>
            Войти
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            Регистрация
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className={headerClasses}>
      <nav className="container mx-auto p-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          АвтоСервисКарта
        </Link>

        {/* 3. НАВИГАЦИЯ ДЛЯ БОЛЬШИХ ЭКРАНОВ */}
        <div className="hidden md:flex gap-4 items-center text-sm font-medium">
          {/* Пока сессия грузится, показываем "скелет" ссылок */}
          {isLoadingSession ? (
            <div className="flex gap-4 items-center animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          ) : (
            <NavLinks />
          )}
        </div>

        {/* 4. КНОПКА "БУРГЕР" ДЛЯ МОБИЛЬНЫХ ЭКРАНОВ */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {/* Иконка "бургера" или "крестика" */}
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* 5. ВЫЕЗЖАЮЩЕЕ МОБИЛЬНОЕ МЕНЮ */}
      <div
        className={`
          md:hidden transition-all duration-300 ease-in-out
          ${isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}
          overflow-hidden
          absolute top-full left-0 right-0
          ${
            isTrulyTransparent
              ? "bg-gray-800 bg-opacity-80 backdrop-blur-sm"
              : "bg-white shadow-lg"
          }
      `}
      >
        <div className="container mx-auto p-4 flex flex-col items-start gap-4">
          <NavLinks />
        </div>
      </div>
    </header>
  );
}
