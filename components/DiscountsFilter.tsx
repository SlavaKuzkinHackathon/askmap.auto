// components/DiscountsFilter.tsx
"use client"; // <-- Этот компонент будет интерактивным

import { useState } from "react";
import type { PartnerWithDiscounts } from "@/app/(main)/discounts/page"; // <-- Импортируем тип
import Link from "next/link";
import PartnerLogo from "@/components/PartnerLogo";

type DiscountsFilterProps = {
  partners: PartnerWithDiscounts[];
  cities: string[];
  isLoggedIn: boolean;
};

export default function DiscountsFilter({
  partners,
  cities,
  isLoggedIn,
}: DiscountsFilterProps) {
  const [selectedCity, setSelectedCity] = useState<string>("all");

  // Фильтруем партнеров "на лету" на основе выбранного города
  const filteredPartners =
    selectedCity === "all"
      ? partners
      : partners.filter((p) => p.city === selectedCity);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800">
            Скидки и акции от партнеров
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Эксклюзивные предложения для пользователей АвтоСервисКарты
          </p>
        </div>

        {/* Блок фильтра по городам (остался здесь) */}
        {cities.length > 1 && (
          <div className="mb-8 flex justify-center">
            <div className="bg-white p-2 rounded-lg shadow-md flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Город:</span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="all">Все города</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Вся логика отображения (осталась здесь) */}
        {filteredPartners.length === 0 ? (
          <p className="text-center text-gray-500 pt-10">
            {selectedCity === "all"
              ? "Мы активно работаем над привлечением партнеров. Скоро здесь появятся скидки!"
              : `В городе ${selectedCity} пока нет партнеров.`}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPartners.map((partner) => (
              <div
                key={partner.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transition-transform hover:scale-[1.02]"
              >
                <div className="p-6 border-b flex items-center gap-4">
                  <PartnerLogo
                    src={partner.logoUrl}
                    alt={partner.name}
                    className="w-24 h-16"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {partner.name}
                    </h2>
                    <p className="text-sm text-gray-500">{partner.city}</p>
                  </div>
                </div>
                <div className="p-6 space-y-4 flex-grow bg-gray-50/50">
                  {partner.discounts.map((discount) => (
                    <div
                      key={discount.id}
                      className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg shadow-sm"
                    >
                      <h3 className="font-semibold text-emerald-900">
                        {discount.title}
                      </h3>
                      <p className="text-sm text-gray-700 mt-1">
                        {discount.description}
                      </p>
                      <div className="mt-4">
                        {isLoggedIn ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              Ваш промокод:
                            </span>
                            <span className="px-3 py-1 bg-gray-200 text-gray-900 font-mono text-base rounded-md border border-gray-300">
                              {discount.promoCode}
                            </span>
                          </div>
                        ) : (
                          <div className="p-3 text-center bg-white/60 backdrop-blur-sm rounded-md border">
                            <p className="text-sm font-semibold text-gray-700">
                              Промокод доступен после регистрации
                            </p>
                            <Link
                              href="/register"
                              className="text-sm text-blue-600 hover:underline font-medium"
                            >
                              Зарегистрироваться бесплатно
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-gray-50 border-t text-sm text-gray-600">
                  <p>{partner.address}</p>
                  <p>{partner.phone}</p>
                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Перейти на сайт
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}