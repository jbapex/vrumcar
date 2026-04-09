import { saleFiltersSchema, type SaleFilters } from './schemas';

function emptyToUndef(s: string | undefined): string | undefined {
  if (!s?.trim()) return undefined;
  return s;
}

export function parseSaleFiltersFromSearchParams(
  raw: Record<string, string | string[] | undefined>,
): SaleFilters {
  const getString = (key: string): string | undefined => {
    const v = raw[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const pageRaw = getString('page');
  const page = pageRaw ? Math.max(1, parseInt(pageRaw, 10) || 1) : undefined;

  const pageSizeRaw = getString('pageSize');
  const pageSize = pageSizeRaw
    ? Math.min(100, Math.max(1, parseInt(pageSizeRaw, 10) || 20))
    : undefined;

  const parsed = saleFiltersSchema.safeParse({
    search: emptyToUndef(getString('search')?.trim()),
    status: emptyToUndef(getString('status')) as SaleFilters['status'] | undefined,
    salesPersonId: emptyToUndef(getString('salesPersonId')),
    paymentMethod: emptyToUndef(getString('paymentMethod')) as
      | SaleFilters['paymentMethod']
      | undefined,
    orderBy: emptyToUndef(getString('orderBy')) as
      | SaleFilters['orderBy']
      | undefined,
    orderDir: emptyToUndef(getString('orderDir')) as
      | SaleFilters['orderDir']
      | undefined,
    page,
    pageSize,
  });

  return parsed.success
    ? parsed.data
    : saleFiltersSchema.parse({});
}

export function saleFiltersToSearchParams(f: SaleFilters): URLSearchParams {
  const q = new URLSearchParams();
  if (f.search) q.set('search', f.search);
  if (f.status) q.set('status', f.status);
  if (f.salesPersonId) q.set('salesPersonId', f.salesPersonId);
  if (f.paymentMethod) q.set('paymentMethod', f.paymentMethod);
  q.set('orderBy', f.orderBy);
  q.set('orderDir', f.orderDir);
  q.set('page', String(f.page));
  q.set('pageSize', String(f.pageSize));
  return q;
}
