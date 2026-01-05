// app/(admin)/admin/partners/page.tsx
import prisma from "@/lib/prisma";
import type { Partner } from "@prisma/client";
import PartnersClientPage from "./PartnersClientPage";

export const dynamic = 'force-dynamic';

async function getPartners(): Promise<Partner[]> {
  return await prisma.partner.findMany({ orderBy: { createdAt: 'desc' } });
}

export default async function AdminPartnersPage() {
  const partners = await getPartners();
  return <PartnersClientPage initialPartners={partners} />;
}