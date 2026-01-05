// app/(admin)/admin/users/UsersClientPage.tsx
"use client";

import { useState } from 'react';
import type { SafeUser } from "./page"; // Импортируем тип из серверного родителя
import UserRow from "./UserRow"; // Импортируем строку таблицы

type UsersClientPageProps = {
  initialUsers: SafeUser[];
};

export default function UsersClientPage({ initialUsers }: UsersClientPageProps) {
  // Инициализируем состояние начальными данными с сервера
  const [users, setUsers] = useState<SafeUser[]>(initialUsers);

  // В будущем, если понадобится перезагрузка данных без обновления страницы,
  // можно будет добавить сюда useEffect с fetch. Сейчас это не нужно.

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Управление пользователями</h1>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
            <tr>
              <th scope="col" className="p-4">Имя</th>
              <th scope="col" className="p-4">Email</th>
              <th scope="col" className="p-4">Роль</th>
              <th scope="col" className="p-4">Дата регистрации</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <UserRow key={user.id} user={user} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}