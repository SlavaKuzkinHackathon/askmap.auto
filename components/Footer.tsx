// components/Footer.tsx

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-600 text-sm text-center p-4 border-t">

      <p>&copy; {new Date().getFullYear()} askmap.ru Все права защищены.</p>
      <p className="mt-2 text-red-600">
        Сайт работает в тестовом режиме. Сервис предоставляется *как есть* и не является коммерческим проектом.
      </p>
    </footer>
  );
}