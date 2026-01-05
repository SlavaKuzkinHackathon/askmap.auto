// lib/helpers.ts
import { ComponentStatus, Role, PartnerType, SymptomCode  } from "@prisma/client";

// --- СЛОВАРЬ И ФУНКЦИЯ ДЛЯ ComponentStatus ---
const componentStatusMap: Record<ComponentStatus, string> = {
  OK: "В НОРМЕ",
  ATTENTION: "ВНИМАНИЕ",
  CRITICAL: "КРИТИЧНО",
};

export function getComponentStatusName(status: ComponentStatus | string | null | undefined): string {
  if (!status) return "Неизвестен";
  // @ts-ignore
  return componentStatusMap[status] || status;
}

const symptomCodeMap: Record<SymptomCode, string> = {
  KNOCK: "Стук, грохот",
  VIBRATION: "Вибрация",
  SQUEAK: "Скрип, писк",
  NOISE: "Шум, гул",
  SMELL: "Запах",
  LEAK: "Утечка",
  WARNING_LIGHT: "Индикатор на панели",
  STARTING_ISSUE: "Проблема с запуском",
  POWER_LOSS: "Потеря мощности",
};

export function getSymptomCodeName(code: SymptomCode | string | null | undefined): string {
  if (!code) return "Неизвестен";
  // @ts-ignore
  return symptomCodeMap[code] || code;
}

// --- СЛОВАРИ И ФУНКЦИИ, КОТОРЫЕ БЫЛИ ВНУТРИ КОМПОНЕНТОВ ---
export const statusClasses: Record<string, { fill: string; text: string; }> = {
  OK:        { fill: 'fill-emerald-500', text: 'text-emerald-500' },
  ATTENTION: { fill: 'fill-yellow-400',  text: 'text-yellow-400' },
  CRITICAL:  { fill: 'fill-red-600',     text: 'text-red-600' },
};
export const fallbackClasses = { fill: 'fill-gray-400', text: 'text-gray-400' };

// Добавьте сюда другие хелперы по мере необходимости...

export {Role, PartnerType, SymptomCode};

export const roleColors: Record<Role, string> = {
  USER: 'bg-blue-100 text-blue-800',
  ADMIN: 'bg-red-100 text-red-800',
  SERVICE_CENTER: 'bg-green-100 text-green-800',
  FLEET_OWNER: 'bg-yellow-100 text-yellow-800',
};