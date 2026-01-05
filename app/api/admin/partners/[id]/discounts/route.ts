// app/api/admin/partners/[id]/discounts/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const discountSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  promoCode: z.string().min(3),
  isActive: z.boolean().optional(),
});

// GET /api/admin/partners/[partnerId]/discounts
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }
  try {
    const partnerId = params.id;
    const discounts = await prisma.discount.findMany({
      where: { partnerId: partnerId },
      orderBy: { createdAt: "desc" },
    });

    revalidatePath("/admin/partners");
    revalidatePath("/discounts");
    revalidatePath("/");

    return NextResponse.json(discounts);
  } catch (error) {
    console.error(`Ошибка при обновлении партнера ${params.id}:`, error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// POST /api/admin/partners/[partnerId]/discounts
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const validation = discountSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.format() },
        { status: 400 }
      );
    }
    const partnerId = params.id;
    const newDiscount = await prisma.discount.create({
      data: {
        ...validation.data,
        partnerId: partnerId, // Привязываем к партнеру из URL
      },
    });

    revalidatePath("/admin/partners");
    revalidatePath("/discounts");
    revalidatePath("/");

    return NextResponse.json(newDiscount, { status: 201 });
  } catch (error) {
    console.error(`Ошибка при обновлении партнера ${params.id}:`, error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
