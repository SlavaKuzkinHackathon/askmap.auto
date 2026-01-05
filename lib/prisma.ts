import { PrismaClient } from '@prisma/client';

// Объявляем глобальную переменную для хранения клиента
declare global {
  var prisma: PrismaClient | undefined;
}

// Создаем клиент, используя существующий глобальный экземпляр,
// или создаем новый, если его нет.
// Это предотвращает создание множества клиентов в режиме разработки (hot-reloading).
const client = globalThis.prisma || new PrismaClient({});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = client
};

export default client;