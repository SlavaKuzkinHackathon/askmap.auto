// app/(admin)/admin/partners/[id]/page.tsx
import prisma from "@/lib/prisma";
import Link from 'next/link';
import DiscountsClientPage from "./DiscountsClientPage";

export const dynamic = 'force-dynamic';

async function getPartnerData(partnerId: string) {
  const [partner, discounts] = await Promise.all([
    prisma.partner.findUnique({ where: { id: partnerId } }),
    prisma.discount.findMany({ where: { partnerId }, orderBy: { createdAt: 'desc' } }),
  ]);
  return { partner, discounts };
}

export default async function PartnerDetailsPage({ params }: { params: { id: string } }) {
  const { partner, discounts } = await getPartnerData(params.id);

  if (!partner) return <div>Партнер не найден</div>;

  return (
    <div>
      <Link href="/admin/partners" className="text-sm ...">&larr; Назад к списку партнеров</Link>
      <div className="my-4">
        <h1 className="text-3xl font-bold">{partner.name}</h1>
        <p className="text-gray-500">{partner.city}</p>
      </div>
      <DiscountsClientPage 
        partnerId={partner.id} 
        initialDiscounts={discounts} 
      />
    </div>
  );
}