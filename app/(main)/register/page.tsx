// app/register/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
 // const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/garage');
    }
  }, [status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Дополнительная проверка на всякий случай
    if (!agreedToTerms) {
        toast.error("Необходимо принять условия для регистрации.");
        return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Регистрация...');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        // Улучшаем обработку ошибок, чтобы показывать ошибки валидации от Zod
        if (data.errors) {
            const errorMessages = Object.values(data.errors).map((err: any) => err._errors.join(', ')).join('; ');
            throw new Error(errorMessages);
        }
        throw new Error(data.error || 'Не удалось зарегистрироваться');
      }
      
      toast.success('Регистрация прошла успешно! Теперь вы можете войти.', { id: loadingToast });
      router.push('/login');

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Произошла ошибка', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || status === 'authenticated') {
    return <div className="container mx-auto p-4 text-center">Загрузка...</div>;
  }

return (
    <div className="container mx-auto p-4 max-w-sm">
      <div className="p-6 bg-white border rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Регистрация</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-2 text-sm font-medium">Имя (необязательно)</label>
            <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} className="input-style" />
          </div>
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium">Email</label>
            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="input-style" required />
          </div>
          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium">Пароль</label>
            <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} className="input-style" required />
          </div>

          {/* 2. НОВЫЙ БЛОК С ЧЕКБОКСОМ */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input 
                id="terms" 
                name="terms"
                type="checkbox" 
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-emerald-300"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="font-light text-gray-500">
                Я принимаю условия{' '}
                <Link href="/terms" target="_blank" className="font-medium text-emerald-600 hover:underline">
                  Пользовательского соглашения
                </Link>
                {' '}и даю согласие на{' '}
                <Link href="/privacy" target="_blank" className="font-medium text-emerald-600 hover:underline">
                  обработку данных
                </Link>
              </label>
            </div>
          </div>
          
          {/* 3. КНОПКА ТЕПЕРЬ ДИНАМИЧЕСКИ НЕАКТИВНА */}
          <button 
            type="submit" 
            disabled={isSubmitting || !agreedToTerms} 
            className="w-full btn-primary"
          >
            {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="text-sm text-center mt-4">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="font-medium text-emerald-600 hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}