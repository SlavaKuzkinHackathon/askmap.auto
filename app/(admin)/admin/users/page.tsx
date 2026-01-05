// app/(admin)/admin/users/page.tsx
import prisma from "@/lib/prisma";
import type { User } from "@prisma/client";
import UsersClientPage from "./UsersClientPage";

export const dynamic = 'force-dynamic';

// ЭТОТ ТИП - ЕДИНСТВЕННЫЙ ИСТОЧНИК ПРАВДЫ
export type SafeUser = Omit<User, 'passwordHash' | 'emailVerified' | 'image' | 'createdAt' | 'updatedAt'> & {
    id: string;
    email: string | null;
    role: "USER" | "SERVICE_CENTER" | "FLEET_OWNER" | "ADMIN";
    createdAt: string;
    updatedAt: string;
};

async function getUsers(): Promise<SafeUser[]> {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true, name: true, email: true,
            role: true, createdAt: true, updatedAt: true,
        },
    });

    return users.map(user => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    }));
}

export default async function AdminUsersPage() {
  const users = await getUsers();
  return (
    <UsersClientPage initialUsers={users} />
  );
}