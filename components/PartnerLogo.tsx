// components/PartnerLogo.tsx
"use client"; // Компонент должен быть клиентским

import Image from 'next/image';

type PartnerLogoProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
};

export default function PartnerLogo({ src, alt, className }: PartnerLogoProps) {
  if (!src) {
    return <div className={`bg-gray-200 rounded-md flex-shrink-0 ${className}`} />;
  }

  // Получаем базовый URL из переменных окружения
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  
  // URL считается локальным, если он относительный (/) или начинается с нашего baseUrl
  const isLocal = src.startsWith('/') || (baseUrl && src.startsWith(baseUrl));

  if (isLocal) {
    // Для ЛОКАЛЬНЫХ файлов используем next/image
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <Image 
          src={src} 
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw" // Примерные размеры для оптимизации
        />
      </div>
    );
  } else {
    // Для ВНЕШНИХ URL используем обычный <img>
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img 
          src={src} 
          alt={alt} 
          className="max-w-full max-h-full object-contain"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          loading="lazy" // Добавим ленивую загрузку
        />
      </div>
    );
  }
}