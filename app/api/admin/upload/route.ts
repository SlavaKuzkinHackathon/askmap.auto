// app/api/admin/upload/route.ts
import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST /api/admin/upload
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ВАЖНО: В реальном проекте (деплой) этот код нужно будет заменить
    // на загрузку в облачное хранилище (S3, MinIO и т.д.)

    // --- НАЧАЛО ЛОКАЛЬНОЙ ИМИТАЦИИ ---
    // Создаем уникальное имя файла, чтобы избежать конфликтов
    const filename = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
    const uploadPath = path.join(process.cwd(), "public/uploads", filename);

    await writeFile(uploadPath, buffer);
    console.log(`Файл сохранен в: ${uploadPath}`);

    // Формируем публичный URL для доступа к файлу
    // Формируем полный URL, который будет работать везде
    /*  const baseUrl =
      process.env.NEXTAUTH_URL ||
      `http://localhost:${process.env.PORT || 3000}`;
    const publicUrl = `${baseUrl}/uploads/${filename}`; */

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:3000`;
    const publicUrl = `${baseUrl}/uploads/${filename}`;

    // --- КОНЕЦ ЛОКАЛЬНОЙ ИМИТАЦИИ ---

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Ошибка при загрузке файла:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
