// scripts/export-knowledge.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Начинаем экспорт данных для сидинга...');

  const dataDir = path.join(__dirname, '../prisma/seed-data');
  await fs.mkdir(dataDir, { recursive: true });

  // --- ЭКСПОРТ КОМПОНЕНТОВ ---
  // Выгружаем все компоненты, кроме "виртуальных" зон, т.к. они всегда должны быть в seed.ts
  const components = await prisma.vehicleComponent.findMany({
    where: {
      NOT: {
        partCode: {
          startsWith: 'zone_',
        },
      },
    },
    orderBy: { partCode: 'asc' },
  });

  const componentsFilePath = path.join(dataDir, 'components.json');
  await fs.writeFile(
    componentsFilePath,
    JSON.stringify(components, null, 2)
  );
  console.log(`✅ Экспортировано ${components.length} компонентов в "components.json"`);


  // --- ЭКСПОРТ БАЗЫ ЗНАНИЙ (ПРАВИЛ) ---
  const symptomCauses = await prisma.symptomCause.findMany({
    orderBy: { symptom: 'asc' },
    include: {
      component: {
        select: {
          partCode: true,
        },
      },
    },
  });

  const knowledgeToExport = symptomCauses.map(cause => ({
    symptom: cause.symptom,
    location: cause.location,
    condition: cause.condition,
    baseWeight: cause.baseWeight,
    componentPartCode: cause.component.partCode,
  }));

  const knowledgeFilePath = path.join(dataDir, 'knowledge-base.json');
  await fs.writeFile(
    knowledgeFilePath,
    JSON.stringify(knowledgeToExport, null, 2)
  );

  console.log(`✅ Экспортировано ${symptomCauses.length} правил в "knowledge-base.json"`);
}

main()
  .catch((e) => {
    console.error('Ошибка во время экспорта:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });