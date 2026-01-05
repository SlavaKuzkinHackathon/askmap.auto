const {
  PrismaClient,
  ComponentCategory,
  SymptomCode,
} = require("@prisma/client");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const prisma = new PrismaClient();

async function main() {
  console.log("Начало сидинга...");

  // --- БЛОК 1: Справочники ---

  // ServiceType (без изменений)
  const serviceTypes = [
    { name: "Плановое ТО", slug: "maintenance" },
    { name: "Ремонт", slug: "repair" },
    { name: "Тюнинг", slug: "tuning" },
    { name: "Диагностика", slug: "diagnostics" },
    { name: "Прочее", slug: "other" },
  ];
  for (const type of serviceTypes) {
    await prisma.serviceType.upsert({
      where: { slug: type.slug },
      update: { name: type.name },
      create: type,
    });
  }
  console.log("Справочник типов работ (ServiceType) обновлен.");

  // --- ИЗМЕНЕНИЕ 1: Добавляем partCode и делаем slug необязательным ---
  // Для базовых компонентов делаем partCode и slug одинаковыми.
  const components = [
    {
      partCode: "engine_oil",
      slug: "engine_oil",
      name: "Масло двигателя",
      category: ComponentCategory.ENGINE_SYSTEM,
      lifespanKm: 10000,
      lifespanMonths: 12,
      importance: 5,
      isSafetyCritical: false,
    },
    {
      partCode: "oil_filter",
      slug: "oil_filter",
      name: "Масляный фильтр",
      category: ComponentCategory.ENGINE_SYSTEM,
      lifespanKm: 10000,
      lifespanMonths: 12,
      importance: 4,
    },
    {
      partCode: "air_filter",
      slug: "air_filter",
      name: "Воздушный фильтр",
      category: ComponentCategory.ENGINE_SYSTEM,
      lifespanKm: 20000,
      lifespanMonths: 24,
      importance: 3,
    },
    {
      partCode: "fuel_filter",
      slug: "fuel_filter",
      name: "Топливный фильтр",
      category: ComponentCategory.ENGINE_SYSTEM,
      lifespanKm: 40000,
      lifespanMonths: 48,
      importance: 3,
    },
    {
      partCode: "spark_plugs",
      slug: "spark_plugs",
      name: "Свечи зажигания",
      category: ComponentCategory.ENGINE_SYSTEM,
      lifespanKm: 30000,
      lifespanMonths: 36,
      importance: 4,
    },
    {
      partCode: "timing_belt",
      slug: "timing_belt",
      name: "Ремень ГРМ",
      category: ComponentCategory.ENGINE_SYSTEM,
      lifespanKm: 60000,
      lifespanMonths: 60,
      importance: 5,
      isSafetyCritical: true,
    },
    {
      partCode: "timing_chain",
      slug: "timing_chain",
      name: "Цепь ГРМ",
      category: ComponentCategory.ENGINE_SYSTEM,
      lifespanKm: 150000,
      lifespanMonths: null,
      importance: 5,
      isSafetyCritical: true,
    },
    {
      partCode: "coolant",
      slug: "coolant",
      name: "Охлаждающая жидкость",
      category: ComponentCategory.ENGINE_SYSTEM,
      lifespanKm: 50000,
      lifespanMonths: 48,
      importance: 4,
    },
    {
      partCode: "brake_pads_front",
      slug: "brake_pads_front",
      name: "Передние тормозные колодки",
      category: ComponentCategory.BRAKE_SYSTEM,
      lifespanKm: 30000,
      lifespanMonths: null,
      importance: 5,
      isSafetyCritical: true,
    },
    {
      partCode: "brake_pads_rear",
      slug: "brake_pads_rear",
      name: "Задние тормозные колодки",
      category: ComponentCategory.BRAKE_SYSTEM,
      lifespanKm: 40000,
      lifespanMonths: null,
      importance: 5,
      isSafetyCritical: true,
    },
    {
      partCode: "brake_discs_front",
      slug: "brake_discs_front",
      name: "Передние тормозные диски",
      category: ComponentCategory.BRAKE_SYSTEM,
      lifespanKm: 60000,
      lifespanMonths: null,
      importance: 5,
      isSafetyCritical: true,
    },
    {
      partCode: "brake_discs_rear",
      slug: "brake_discs_rear",
      name: "Задние тормозные диски",
      category: ComponentCategory.BRAKE_SYSTEM,
      lifespanKm: 80000,
      lifespanMonths: null,
      importance: 5,
      isSafetyCritical: true,
    },
    {
      partCode: "brake_fluid",
      slug: "brake_fluid",
      name: "Тормозная жидкость",
      category: ComponentCategory.BRAKE_SYSTEM,
      lifespanKm: 40000,
      lifespanMonths: 24,
      importance: 4,
      isSafetyCritical: true,
    },
    {
      partCode: "transmission_oil",
      slug: "transmission_oil",
      name: "Масло трансмиссии",
      category: ComponentCategory.TRANSMISSION,
      lifespanKm: 60000,
      lifespanMonths: 72,
      importance: 4,
    },
    {
      partCode: "clutch",
      slug: "clutch",
      name: "Сцепление",
      category: ComponentCategory.TRANSMISSION,
      lifespanKm: 120000,
      lifespanMonths: null,
      importance: 4,
      isSafetyCritical: false,
    },
    {
      partCode: "battery",
      slug: "battery",
      name: "Аккумулятор (АКБ)",
      category: ComponentCategory.ELECTRICAL,
      lifespanKm: null,
      lifespanMonths: 48,
      importance: 3,
    },
    {
      partCode: "cabin_filter",
      slug: "cabin_filter",
      name: "Салонный фильтр",
      category: ComponentCategory.BODY,
      lifespanKm: 15000,
      lifespanMonths: 12,
      importance: 1,
    },
    {
      partCode: "windshield_wipers",
      slug: "windshield_wipers",
      name: "Щётки стеклоочистителя",
      category: ComponentCategory.BODY,
      lifespanKm: null,
      lifespanMonths: 12,
      importance: 2,
      isSafetyCritical: true,
    },
    {
      partCode: "tires_summer",
      slug: "tires_summer",
      name: "Летние шины",
      category: ComponentCategory.WHEELS_TIRES,
      lifespanKm: 50000,
      lifespanMonths: 60,
      importance: 5,
      isSafetyCritical: true,
    },
    {
      partCode: "tires_winter",
      slug: "tires_winter",
      name: "Зимние шины",
      category: ComponentCategory.WHEELS_TIRES,
      lifespanKm: 50000,
      lifespanMonths: 60,
      importance: 5,
      isSafetyCritical: true,
    },
    {
      partCode: "tire_fitting",
      slug: "tire_fitting",
      name: "Шиномонтаж / балансировка",
      category: ComponentCategory.WHEELS_TIRES,
      lifespanKm: null,
      lifespanMonths: 6,
      importance: 2,
    },
    {
      partCode: "zone_engine",
      slug: "zone_engine",
      name: "Подкапотное пространство",
      category: ComponentCategory.ENGINE_SYSTEM,
      importance: 0,
    },
    {
      partCode: "zone_chassis",
      slug: "zone_chassis",
      name: "Ходовая часть",
      category: ComponentCategory.SUSPENSION,
      importance: 0,
    },
    {
      partCode: "zone_wheels",
      slug: "zone_wheels",
      name: "Колеса и шины",
      category: ComponentCategory.WHEELS_TIRES,
      importance: 0,
    },
    {
      partCode: "zone_salon",
      slug: "zone_salon",
      name: "Салон",
      category: ComponentCategory.BODY,
      importance: 0,
    },
  ];

  for (const c of components) {
    await prisma.vehicleComponent.upsert({
      where: { partCode: c.partCode },
      update: {
        name: c.name,
        slug: c.slug,
        category: c.category,
        lifespanKm: c.lifespanKm,
        lifespanMonths: c.lifespanMonths,
        importance: c.importance,
        isSafetyCritical: c.isSafetyCritical ?? false,
      },
      create: c,
    });
  }
  console.log(`Создано/обновлено ${components.length} компонентов.`);

  // --- ИЗМЕНЕНИЕ 2: Синонимы теперь привязываются по partCode ---
  const allComponents = await prisma.vehicleComponent.findMany({
    select: { id: true, partCode: true },
  });
  const byPartCode = Object.fromEntries(
    allComponents.map((c) => [c.partCode, c.id])
  );

  const aliases = [
    { alias: "замена масла", partCode: "engine_oil" },
    { alias: "масло двс", partCode: "engine_oil" },
    { alias: "масляный фильтр", partCode: "oil_filter" },
    { alias: "воздушный фильтр", partCode: "air_filter" },
    { alias: "фильтр салона", partCode: "cabin_filter" },
    { alias: "колодки передние", partCode: "brake_pads_front" },
    { alias: "колодки задние", partCode: "brake_pads_rear" },
    { alias: "тормозная жидкость", partCode: "brake_fluid" },
    { alias: "свечи зажигания", partCode: "spark_plugs" },
    { alias: "шиномонтаж", partCode: "tire_fitting" },
    { alias: "переобувка", partCode: "tire_fitting" },
  ];

  for (const a of aliases) {
    const componentId = byPartCode[a.partCode];
    if (!componentId) {
      console.warn(
        `ПРЕДУПРЕЖДЕНИЕ: Не найден компонент для синонима: "${a.alias}" (partCode: ${a.partCode})`
      );
      continue;
    }
    await prisma.componentAlias.upsert({
      where: { alias: a.alias },
      update: { componentId },
      create: { alias: a.alias, componentId, locale: "ru" },
    });
  }
  console.log(`Создано/обновлено ${aliases.length} синонимов.`);

  // --- БЛОК 2: Создание админа (без изменений) ---
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const adminExists = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (!adminExists) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          role: "ADMIN",
          name: "Администратор",
        },
      });
      console.log(`Пользователь-администратор ${adminEmail} успешно создан.`);
    } else {
      console.log(`Пользователь-администратор ${adminEmail} уже существует.`);
    }
  } else {
    console.log(
      "Переменные ADMIN_EMAIL и ADMIN_PASSWORD не найдены, создание админа пропущено."
    );
  }

  // --- ИЗМЕНЕНИЕ 3: Полностью переписанный блок импорта "Базы Знаний" ---
  console.log("Импорт дополнительных компонентов...");
  try {
    const componentsPath = path.join(__dirname, "seed-data", "components.json");
    if (fs.existsSync(componentsPath)) {
      const componentsRawData = fs.readFileSync(componentsPath, "utf-8");
      const componentsData = JSON.parse(componentsRawData);
      let count = 0;
      for (const component of componentsData) {
        await prisma.vehicleComponent.upsert({
          where: { partCode: component.partCode },
          update: component,
          create: component,
        });
        count++;
      }
      console.log(
        `✅ Импортировано/обновлено ${count} дополнительных компонентов из файла.`
      );
    } else {
      console.warn("⚠️  Файл components.json не найден. Импорт пропущен.");
    }
  } catch (error) {
    console.error("❌ Ошибка во время импорта компонентов:", error);
  }

  // --- БЛОК 6: Импорт "Базы Знаний" из JSON ---
  console.log('Импорт "Базы Знаний"...');
  try {
    const kbPath = path.join(__dirname, "seed-data", "knowledge-base.json");
    if (fs.existsSync(kbPath)) {
      const kbRawData = fs.readFileSync(kbPath, "utf-8");
      const kbData = JSON.parse(kbRawData);

      const allDbComponents = await prisma.vehicleComponent.findMany({
        select: { id: true, partCode: true },
      });
      const componentMap = new Map(
        allDbComponents.map((c) => [c.partCode, c.id])
      );

      let createdCount = 0;
      let updatedCount = 0;

      for (const cause of kbData) {
        const componentId = componentMap.get(cause.componentPartCode);
        if (!componentId) {
          console.warn(
            `Пропущено правило: не найден компонент с partCode "${cause.componentPartCode}"`
          );
          continue;
        }

        // --- НАСТОЯЩЕЕ ИСПРАВЛЕНИЕ ЗДЕСЬ ---
        // Мы больше не используем `findUnique` с проблемным ключом.
        // Вместо этого мы используем `findFirst`, который гибче.
        const existingCause = await prisma.symptomCause.findFirst({
          where: {
            symptom: cause.symptom,
            location: cause.location || null, // findFirst отлично работает с null
            condition: cause.condition || null,
            componentId: componentId,
          },
        });

        if (existingCause) {
          // Если нашли - обновляем
          await prisma.symptomCause.update({
            where: { id: existingCause.id },
            data: { baseWeight: cause.baseWeight },
          });
          updatedCount++;
        } else {
          // Если не нашли - создаем
          await prisma.symptomCause.create({
            data: {
              symptom: cause.symptom,
              location: cause.location || null,
              condition: cause.condition || null,
              baseWeight: cause.baseWeight,
              componentId: componentId,
            },
          });
          createdCount++;
        }
      }
      console.log(
        `✅ Импорт "Базы Знаний" завершен. Обработано правил: ${createdCount}.`
      );
    } else {
      console.warn("⚠️  Файл knowledge-base.json не найден. Импорт пропущен.");
    }
  } catch (error) {
    console.error('❌ Ошибка во время импорта "Базы Знаний":', error);
  }
}

main()
  .catch((e) => {
    console.error("Ошибка во время выполнения сидинга:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Сидинг успешно завершен.");
  });
