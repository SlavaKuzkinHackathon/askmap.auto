import { Mail, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg border border-white border-opacity-20">
      <h3 className="font-bold text-xl mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black bg-opacity-60 z-10" />
        <Image
          src="/images/hero-bg.jpg"
          alt="Фон с автомобильной тематикой"
          priority
          fill
          className="object-cover"
          quality={80}
        />
      </div>

      <div className="relative z-20 container mx-auto px-4 py-24 text-center flex flex-col items-center">
        <Image
          src="/logo.png" 
          alt="AskMap Logo"
          width={96}
          height={96}
          className="mb-6 h-24 w-24"
        />

        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
          Вся история вашего авто — в одной карте
        </h1>

        <p className="mt-4 max-w-2xl text-lg md:text-xl text-gray-300">
          Ведите учет обслуживания, получайте скидки от партнеров и продавайте
          машину выгоднее с AskMap.
        </p>
        <div className="group mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/diagnostics"
            className="
      px-8 py-3 rounded-lg font-semibold transition-transform hover:scale-105
      text-white
      
      bg-emerald-600 group-hover:bg-white group-hover:bg-opacity-20
      hover:!bg-emerald-600
    "
          >
            Начать диагностику
          </Link>

          <Link
            href="/register"
            className="
      px-8 py-3 rounded-lg font-semibold transition-transform hover:scale-105
      text-white
      
      bg-white bg-opacity-20
      hover:!bg-emerald-600
    "
          >
            Создать карту авто (Бесплатно)
          </Link>

          <Link
            href="/discounts"
            className="
      px-8 py-3 rounded-lg font-semibold transition-transform hover:scale-105
      text-white
      
      bg-white bg-opacity-20
      hover:!bg-emerald-600
    "
          >
            Смотреть скидки
          </Link>
        </div>

      </div>

      <div className="relative z-20 container mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Feature
            title="AI-Диагност"
            description="Опишите проблему своими словами, и наш ИИ-помощник определит вероятные причины неисправности."
          />
          <Feature
            title="Интерактивная Карта"
            description="Визуализируйте состояние каждого узла вашего автомобиля на наглядной 2D-схеме."
          />
          <Feature
            title="Скидки от Партнеров"
            description="Получайте эксклюзивные промокоды на запчасти и услуги в СТО вашего города."
          />
        </div>
      </div>

      <div className="relative z-20 text-center pb-24 px-4">
        <h2 className="text-2xl font-bold">Остались вопросы?</h2>
        <p className="text-gray-300 mt-2 max-w-lg mx-auto">Присоединяйтесь к нашему Telegram-каналу для обсуждений или напишите нам напрямую.</p>
        <div className="mt-6 flex justify-center flex-wrap gap-4">
          <a
            href="https://t.me/+KipVxnclE0I2NzMy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg font-semibold transition-transform hover:scale-105"
          >
            <Send size={18} />
            Telegram
          </a>
          <a
            href="mailto:ask-map@mail.ru"
            className="flex items-center gap-2 px-6 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg font-semibold transition-transform hover:scale-105"
          >
            <Mail size={18} />
            Email
          </a>
        </div>
      </div>

    </div>
  );
}
