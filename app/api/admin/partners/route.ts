// app/api/admin/partners/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { PartnerType } from "@prisma/client";
import { revalidatePath } from "next/cache";

const partnerSchema = z.object({
  name: z.string().min(2, "Название слишком короткое"),
  type: z.nativeEnum(PartnerType),
  city: z.string().min(2, "Укажите город"),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url("Неверный формат URL").optional().nullable(),
  logoUrl: z.string().url("Неверный формат URL").optional().nullable(),
  inn: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/partners
export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }
  try {
    const partners = await prisma.partner.findMany({
      orderBy: { createdAt: "desc" },
    });

    revalidatePath("/admin/partners");
    revalidatePath("/discounts");
    revalidatePath("/");

    return NextResponse.json(partners);
  } catch (error) {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// POST /api/admin/partners
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const validation = partnerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.format() },
        { status: 400 }
      );
    }
    // "Разбираем" валидированные данные на переменные
    const {
      name,
      type,
      city,
      address,
      phone,
      website,
      logoUrl,
      inn,
      isActive,
    } = validation.data;
    const newPartner = await prisma.partner.create({
      data: {
        name,
        type,
        city,
        address,
        phone,
        website,
        logoUrl,
        inn,
        isActive,
      },
    });

    revalidatePath("/admin/partners");
    revalidatePath("/discounts");
    revalidatePath("/");

    return NextResponse.json(newPartner, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
