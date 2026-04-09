import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { listVehicles } from '@/modules/vehicles/service';
import { parseVehicleFiltersFromSearchParams } from '@/modules/vehicles/search-params';
import type { VehicleStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

const STATUS_CSV: Record<VehicleStatus, string> = {
  AVAILABLE: 'Disponível',
  RESERVED: 'Reservado',
  SOLD: 'Vendido',
  IN_PREPARATION: 'Em preparação',
  IN_MAINTENANCE: 'Em manutenção',
  INACTIVE: 'Inativo',
};

function csvCell(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orgSlug } = await params;
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      memberships: {
        where: { userId: session.user.id, isActive: true },
        take: 1,
      },
    },
  });

  if (!org || org.memberships.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const spObj: Record<string, string | string[] | undefined> = {};
  url.searchParams.forEach((v, k) => {
    spObj[k] = v;
  });

  const baseFilters = parseVehicleFiltersFromSearchParams(spObj);
  const filters = {
    ...baseFilters,
    page: 1,
    pageSize: 10_000,
  };

  const result = await listVehicles(org.id, filters);

  const header =
    'Marca;Modelo;Versão;Ano;KM;Cor;Placa;Preço;Status';
  const lines = result.items.map((v) =>
    [
      csvCell(v.brand),
      csvCell(v.model),
      csvCell(v.version ?? ''),
      csvCell(v.year != null ? String(v.year) : ''),
      csvCell(v.mileageKm != null ? String(v.mileageKm) : ''),
      csvCell(v.exteriorColor ?? ''),
      csvCell(v.licensePlate ?? ''),
      csvCell(String(v.salePriceCents / 100)),
      csvCell(STATUS_CSV[v.status]),
    ].join(';'),
  );

  const csv = [header, ...lines].join('\n');
  const date = new Date().toISOString().slice(0, 10);
  const filename = `estoque-${date}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
