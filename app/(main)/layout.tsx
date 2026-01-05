
"use client";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePathname } from 'next/navigation';
import CookieBanner from '@/components/CookieBanner';
import { QueryProvider } from '@/components/providers/QueryProvider';
import AuthProvider from "@/components/AuthProvider";
import { Toaster } from 'react-hot-toast';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <div className={`flex flex-col min-h-screen ${isHomePage ? '' : 'bg-gray-50'}`}>
      <QueryProvider>
        <AuthProvider>
          <Toaster position="bottom-right" />
          <Header isTransparent={isHomePage} />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <CookieBanner />
        </AuthProvider>
      </QueryProvider>
    </div>
  );
}


/* "use client"

// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css'; // Ваши глобальные стили
import Header from '@/components/Header'; // Импортируем компоненты
import Footer from '@/components/Footer';
import AuthProvider from "@/components/AuthProvider";
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { usePathname } from 'next/navigation';
import CookieBanner from '@/components/CookieBanner';



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/icon0.svg" />
        <link rel="icon" type="image/png" href="/icon1.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-title" content="AskMap" />
      </head>
      <body className={`flex flex-col min-h-screen ${isHomePage ? '' : 'bg-gray-50'}`}>
        <QueryProvider>
          <AuthProvider>
            <Toaster position="bottom-right" />
            <Header isTransparent={isHomePage} />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <CookieBanner />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
} */