// app/login/page.tsx
"use client";

import { useState, useEffect  } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession  } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  //  Добавляем useEffect, который следит за статусом сессии
  useEffect(() => {
    // Если сессия загрузилась и пользователь авторизован...
    if (status === 'authenticated') {
      // ...перенаправляем его в гараж.
      router.push('/garage');
    }
  }, [status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Используем signIn из next-auth
      const result = await signIn('credentials', {
        ...formData,
        redirect: false, // Важно: отключаем автоматический редирект
      });

      if (result?.error) {
        // Если signIn вернул ошибку (из нашего `authorize`)
        throw new Error(result.error);
      }

      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();

      // Шаг 3: Проверяем роль и делаем редирект вручную.
      if (sessionData?.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/garage');
      }
      
      // Если вход успешен, перенаправляем в гараж
      //router.push('/garage');
      router.refresh(); // Обновляем данные на странице гаража

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };

   // Пока идет проверка сессии, можно показать заглушку
   if (status === 'loading' || status === 'authenticated') {
    return <div className="container mx-auto p-4 text-center">Загрузка...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-sm">
      <div className="p-6 bg-white border rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Вход</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium">Email</label>
            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="input-style" required />
          </div>
          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium">Пароль</label>
            <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} className="input-style" required />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full btn-primary">
            {isSubmitting ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p className="text-sm text-center mt-4">
          Нет аккаунта?{' '}
          <Link href="/register" className="font-medium text-emerald-600 hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}