
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'] });

// 2. Объект metadata теперь может спокойно экспортироваться.
export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'), // Оставляем для правильных ссылок на иконки
  title: {
    default: 'AskMap - Интеллектуальный помощник автовладельца',
    template: '%s | AskMap',
  },
  description: 'Диагностика неисправностей по симптомам, верифицируемая история обслуживания и поиск выгодных решений для ремонта вашего автомобиля.',
  applicationName: 'AskMap',
  keywords: ['диагностика авто', 'ремонт автомобиля', 'история обслуживания', 'ошибки авто', 'СТО', 'сервисная книжка', 'поломка авто'],
  manifest: '/site.webmanifest',
};

// 3. RootLayout теперь очень простой. Он не использует никаких хуков.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning={true}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta property="og:title" content="AskMap - Интеллектуальный помощник автовладельца" />
        <meta property="og:description" content="Переводим сложные технические проблемы на понятный человеческий язык." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://askmap.ru" />
        <meta property="og:image" content="https://askmap.ru/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="AskMap" />
        <meta property="og:locale" content="ru_RU" />

        {/* <meta name="yandex-verification" content="КОД_ВЕРИФИКАЦИИ" /> */}

        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/icon0.svg" />
        <link rel="icon" type="image/png" href="/icon1.png" />
        <link rel="manifest" href="/site.webmanifest.json" />
        <meta name="apple-mobile-web-app-title" content="AskMap" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}