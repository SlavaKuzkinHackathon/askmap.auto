import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DocumentStatus, RecordSource, ServiceRecordStatus } from '@prisma/client';
// 1. »—ѕ–ј¬Ћя≈ћ »ћѕќ–“: »спользуем относительный путь, он всегда надежнее
import { ParsedDocumentV1, ParsedItem } from 'types/parsed';

// «ј√Ћ”Ў ј OCR
async function runOCRFromStorage(storageUrl: string): Promise<string> {
  return `
    —“ќ јвтоћир
    »ЌЌ 7701****** 01.08.2025
    «амена масла
    ‘ильтр масл€ный
    »того: 4500.00
    ѕробег: 132400 км
  `;
}

// ”прощЄнный парсер
function simpleParse(ocrText: string) {
  const lower = ocrText.toLowerCase();
  const dateMatch = lower.match(/(\d{2}\.\d{2}\.\d{4})/);
  const totalMatch = lower.match(/итог[о|a][^0-9]*([0-9]+[\.,]?[0-9]{0,2})/);
  const odoMatch = lower.match(/пробег[^0-9]*([0-9]{4,7})/);
  const merchant = ocrText.trim().split('\n').map(s => s.trim()).filter(Boolean)[0]?.slice(0, 80);
  const lines = ocrText.split('\n').map(s => s.trim()).filter(s => s && !/итог/i.test(s) && !/инн/i.test(s) && !/пробег/i.test(s));
  const itemsRaw = lines.slice(1, 8);
  return { date: dateMatch ? dateMatch[1].split('.').reverse().join('-') : undefined, total: totalMatch ? Number(totalMatch[1].replace(',', '.')) : undefined, merchant, odometer: odoMatch ? Number(odoMatch[1]) : undefined, itemsRaw };
}

function normalize(s: string) {
  // Эта регулярка оставляет только русские/английские буквы, цифры и пробелы
  return s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}


export async function POST(_req: Request, { params }: { params: { id:string } }) {
  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  if (!doc.carId) return NextResponse.json({ error: 'Document is not linked to a car' }, { status: 400 });

  await prisma.document.update({ where: { id: doc.id }, data: { status: DocumentStatus.PROCESSING } });

  const ocrText = await runOCRFromStorage(doc.storageUrl);
  const parsed0 = simpleParse(ocrText);
  const aliases = await prisma.componentAlias.findMany({
    include: { component: { select: { id: true, slug: true, name: true } } },
  });

  const parsedItems: ParsedItem[] = [];
  const componentIds = new Set<string>();

  for (const raw of parsed0.itemsRaw) {
    const n = normalize(raw);
    let best: { slug: string; id: string; conf: number } | null = null;
    for (const a of aliases) {
      const na = normalize(a.alias);
      if (!na) continue;
      if (n.includes(na)) {
        const conf = 0.8 + Math.min(0.19, na.length / Math.max(10, n.length) / 2);
        if (!best || conf > best.conf) {
          best = { slug: a.component.slug, id: a.component.id, conf };
        }
      }
    }
    if (best) {
      componentIds.add(best.id);
      parsedItems.push({ raw, componentSlug: best.slug, confidence: Number(best.conf.toFixed(2)) });
    } else {
      parsedItems.push({ raw, confidence: 0.3 });
    }
  }

  const parsed: ParsedDocumentV1 = {
    version: '1.0', kind: 'work_order', date: parsed0.date, total: parsed0.total,
    currency: 'RUB', merchant: parsed0.merchant, odometer: parsed0.odometer, items: parsedItems,
    meta: { ocrProvider: 'yandex', language: 'ru' },
  };

  const conf = (parsed.date ? 0.3 : 0) + (parsed.total ? 0.3 : 0) + (parsedItems.some(i => i.componentSlug) ? 0.3 : 0) + 0.1;

  const updatedDoc = await prisma.document.update({
    where: { id: doc.id },
    data: { status: DocumentStatus.PARSED, ocrText, parsed: parsed as any, confidence: Math.min(1, conf) },
  });

  if (updatedDoc.type === 'ODOMETER' && updatedDoc.carId && parsed0.odometer) {
    await prisma.odometerReading.create({
      data: { carId: updatedDoc.carId, value: parsed0.odometer, source: 'OCR', documentId: updatedDoc.id },
    });
  }

  let serviceRecordId: string | undefined;
  if (updatedDoc.type !== 'ODOMETER' && updatedDoc.carId) {
    const date = parsed0.date ? new Date(parsed0.date) : new Date();
    const mileage = parsed0.odometer || 0;
    const title = parsedItems.find(i => i.componentSlug)?.raw || '–аботы по документу';
    
    // 2. »—ѕ–ј¬Ћя≈ћ Ћќ√» ” —ќ«ƒјЌ»я «јѕ»—»
    const maintenanceType = await prisma.serviceType.findUnique({
      where: { slug: 'maintenance' }
    });
    if (!maintenanceType) {
      throw new Error("Service type 'maintenance' not found in the database. Please run `prisma db seed`.");
    }

    const sr = await prisma.serviceRecord.create({
      data: {
        carId: updatedDoc.carId, date, mileage, title,
        serviceTypeId: maintenanceType.id, // <-- »—ѕќЋ№«”≈ћ ID
        description: '—оздано на основе документа (OCR)',
        cost: parsed0.total,
        location: parsed0.merchant,
        status: ServiceRecordStatus.DRAFT,
        source: RecordSource.OCR,
        sourceDocumentId: updatedDoc.id,
        components: { connect: Array.from(componentIds).map(id => ({ id })) },
      },
    });
    serviceRecordId = sr.id;
  }

  return NextResponse.json({
    documentId: updatedDoc.id,
    status: updatedDoc.status,
    confidence: updatedDoc.confidence,
    parsed: updatedDoc.parsed,
    serviceRecordId,
  });
}