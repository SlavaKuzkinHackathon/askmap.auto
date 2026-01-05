// types/next-auth.d.ts

import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";
import { Role } from "@prisma/client"; // Импортируем наш enum Role

// Расширяем стандартные типы, добавляя наши кастомные поля

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"]; // Добавляем id и role к стандартным полям (name, email, image)
  }

  interface User extends DefaultUser {
    role: Role; // Добавляем role к стандартному объекту User
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: Role; // Добавляем id и role в токен
  }
}