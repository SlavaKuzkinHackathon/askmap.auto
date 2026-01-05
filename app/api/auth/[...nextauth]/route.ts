// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
  // 1. Адаптер для связи Next-Auth с базой данных Prisma
  adapter: PrismaAdapter(prisma),

  // 2. Провайдеры аутентификации. У нас один - по логину и паролю.
  providers: [
    CredentialsProvider({
      // Имя провайдера, будет отображаться на странице входа
      name: "Credentials",
      credentials: {
        // Поля, которые мы ожидаем от формы входа
        email: { label: "Email", type: "text", placeholder: "test@example.com" },
        password: { label: "Password", type: "password" },
      },
      // 3. Логика проверки пользователя (самая важная часть)
      async authorize(credentials) {
        // Проверяем, что email и пароль были переданы
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Пожалуйста, введите email и пароль");
        }

        // Ищем пользователя в базе данных по email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Если пользователь не найден...
        if (!user || !user.passwordHash) {
          throw new Error("Пользователь с таким email не найден");
        }

        // Сравниваем переданный пароль с хэшем в базе данных
        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        // Если пароли не совпадают...
        if (!isPasswordCorrect) {
          throw new Error("Неверный пароль");
        }
        
        // Если все проверки пройдены, возвращаем объект пользователя.
        // Next-Auth использует его для создания сессии.
        // Важно: не возвращайте хэш пароля на клиент!
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  // 4. Настройка страниц и сессии
  pages: {
    signIn: '/login', // Указываем Next-Auth, где находится наша страница входа
    // Можно также указать страницы ошибки, регистрации и т.д.
  },
  session: {
    strategy: "jwt", // Используем JWT для сессий, это стандарт для Credentials Provider
  },

  // 5. Расширение сессии и JWT
  // Добавляем в токен и сессию кастомные поля, например, ID и роль пользователя
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-ignore
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.id;
        // @ts-ignore
        session.user.role = token.role;
      }
      return session;
    },
  },
  
  secret: process.env.NEXTAUTH_SECRET, // Секретный ключ для подписи JWT
  debug: process.env.NODE_ENV === "development", // Включаем логи для отладки в режиме разработки
};

// Экспортируем хендлеры для GET и POST запросов
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };