// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // withAuth расширяет ваш Request объектом token.
  function middleware(req) {
    // Получаем токен с данными пользователя (id, role и т.д.)
    const token = req.nextauth.token;

    // --- Логика защиты админ-раздела ---
    // 1. Проверяем, что URL начинается с /admin
    // 2. И что роль пользователя НЕ является ADMIN
    if (req.nextUrl.pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      // Если условия совпали, перенаправляем на главную страницу
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      // Этот коллбэк определяет, авторизован ли пользователь в принципе.
      // Если токен существует, значит, пользователь залогинен.
      authorized: ({ token }) => !!token,
    },
  }
);

// matcher указывает, к каким путям применять это middleware.
export const config = {
  matcher: [
    "/garage/:path*", // Защищаем все страницы в "Гараже"
    "/admin/:path*",   // Защищаем все страницы в "Админке"
  ],
};