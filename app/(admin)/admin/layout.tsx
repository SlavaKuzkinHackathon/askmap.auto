// app/(admin)/admin/layout.tsx
"use client"; // Превращаем в клиентский компонент для использования хука

import Link from "next/link";
import { usePathname } from "next/navigation"; // Хук для определения текущего URL
import { Toaster } from "react-hot-toast";
import "@/app/globals.css";

// Простой компонент для навигационной ссылки с иконкой
function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <li>
      <Link
        href={href}
        className={`flex items-center gap-3 p-2 rounded-md text-sm transition-colors ${isActive
          ? "bg-emerald-600 text-white"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
      >
        {icon}
        {children}
      </Link>
    </li>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-gray-100">
        <Toaster position="bottom-right" />
        <div className="flex h-screen">
          <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col">
            <div>
              <div className="mb-8">
                <Link href="/admin" className="text-xl font-bold text-white">
                  AskMap
                </Link>
                <span className="text-xs text-gray-400 ml-2">Админ-панель</span>
              </div>
              <nav>
                <ul className="space-y-2">
                  <NavLink href="/admin" icon={<IconDashboard />}>
                    {" "}
                    __Дашборд
                  </NavLink>
                  <NavLink href="/admin/users" icon={<IconUsers />}>
                    {" "}
                    __Пользователи
                  </NavLink>
                  <NavLink href="/admin/cars" icon={<IconCars />}>
                    __Автомобили
                  </NavLink>
                  <NavLink href="/admin/components" icon={<IconComponents />}>
                    __Справочники
                  </NavLink>
                  <NavLink href="/admin/partners" icon={<IconPartners />}>
                    __Партнеры
                  </NavLink>
                  <NavLink href="/admin/knowledge-base" icon={<IconKnowledgeBase />}>
                    База знаний
                  </NavLink>
                </ul>
              </nav>
            </div>
            <div className="mt-auto">
              <Link
                href="/"
                target="_blank" // Открываем в новой вкладке, чтобы не терять админку
                className="flex items-center gap-3 p-2 rounded-md text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                <span>На главную страницу</span>
              </Link>
            </div>
          </aside>
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}

// --- Иконки (простые SVG компоненты) ---
const IconDashboard = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);
const IconUsers = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconCars = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 16.5V15a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v1.5M10 11h4M17.5 16.5c1.4 0 2.5-.9 2.5-2V13c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v1.5c0 1.1 1.1 2 2.5 2M6 11V7.5c0-1.4 1.1-2.5 2.5-2.5h7c1.4 0 2.5 1.1 2.5 2.5V11" />
  </svg>
);
const IconComponents = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20.94c1.5 0 2.75 1.06 4 1.55 1.25.5 2.5 1 4 1v-3.5c-1.5 0-2.75-1.06-4-1.55-1.25-.5-2.5-1-4-1s-2.75 1.06-4 1.55c-1.25.5-2.5 1-4 1v3.5c1.5 0 2.75-1.06 4-1.55 1.25-.5 2.5-1 4-1zM12 11.94c1.5 0 2.75 1.06 4 1.55 1.25.5 2.5 1 4 1v-3.5c-1.5 0-2.75-1.06-4-1.55-1.25-.5-2.5-1-4-1s-2.75 1.06-4 1.55c-1.25.5-2.5 1-4 1v3.5c1.5 0 2.75-1.06 4-1.55 1.25-.5 2.5-1 4-1zM12 2.94c1.5 0 2.75 1.06 4 1.55 1.25.5 2.5 1 4 1v-3.5c-1.5 0-2.75-1.06-4-1.55C14.75-.55 13.5-1 12-1s-2.75 1.06-4 1.55C6.75 1.05 5.5 2 4 2v3.5c1.5 0 2.75-1.06 4-1.55 1.25-.5 2.5-1 4-1z" />
  </svg>
);
const IconPartners = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
  </svg>
);

const IconKnowledgeBase = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);
