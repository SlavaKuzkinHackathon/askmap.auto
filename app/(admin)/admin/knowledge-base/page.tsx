// app/(admin)/admin/knowledge-base/page.tsx
import prisma from "@/lib/prisma";
import KnowledgeBaseClientPage from "./KnowledgeBaseClientPage";

export const dynamic = "force-dynamic";

async function getData() {
  const [causes, components] = await Promise.all([
    prisma.symptomCause.findMany({
      orderBy: { symptom: "asc" },
      include: { component: { select: { name: true } } }, // Включаем имя компонента
    }),

    prisma.vehicleComponent.findMany({
      orderBy: { name: "asc" },
    }),
  ]);
  return { causes, components };
}

export default async function KnowledgeBasePage() {
  const { causes, components } = await getData();
  return (
    <KnowledgeBaseClientPage
      initialCauses={causes}
      allComponents={components}
    />
  );
}
