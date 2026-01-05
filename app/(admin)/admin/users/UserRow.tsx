// app/(admin)/admin/users/UserRow.tsx
"use client";

import { useState } from 'react';
import type { SafeUser } from "./page"; // Импортируем тип из родительской страницы
import {Role} from '@/lib/helpers'; // Используем наш Enum из хелпера
import toast from 'react-hot-toast';
import { roleColors } from '@/lib/helpers'; // Импортируем цвета

export default function UserRow({ user }: { user: SafeUser }) {
    const [currentRole, setCurrentRole] = useState(user.role);
  

  const handleRoleChange = async (newRole: Role) => {
    const loadingToast = toast.loading("Обновление роли...");
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) throw new Error('Не удалось обновить роль');
      
      setCurrentRole(newRole);
      toast.success(`Роль для ${user.email} обновлена!`, { id: loadingToast });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка", { id: loadingToast });
      setCurrentRole(user.role);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ru-RU');

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-4 font-medium text-gray-900">{user.name || 'Не указано'}</td>
      <td className="p-4">{user.email}</td>
      <td className="p-4">
        <select 
          value={currentRole}
          onChange={(e) => handleRoleChange(e.target.value as Role)}
          className={`px-2 py-1 text-xs font-semibold rounded-full border-none outline-none appearance-none ${roleColors[currentRole]}`}
        >
          {Object.values(Role).map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </td>
      <td className="p-4">{formatDate(user.createdAt)}</td>
    </tr>
  );
}