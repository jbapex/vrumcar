import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { exportSalesCSV } from '@/modules/reports/reports-service';

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ orgSlug: string }> },
) {
  const { orgSlug } = await ctx.params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
  const year = parseInt(
    url.searchParams.get('year') ?? String(new Date().getFullYear()),
    10,
  );
  const month = parseInt(
    url.searchParams.get('month') ?? String(new Date().getMonth() + 1),
    10,
  );

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const csv = await exportSalesCSV(org.id, { startDate, endDate });

  const fileName = `vendas_${year}_${String(month).padStart(2, '0')}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
