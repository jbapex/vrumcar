import { vehicleFiltersSchema } from './schemas';

/** Converte searchParams da URL em filtros validados (Next 15). */
export function parseVehicleFiltersFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
) {
  const get = (k: string): string | undefined => {
    const v = sp[k];
    if (typeof v === 'string' && v !== '') return v;
    if (Array.isArray(v) && typeof v[0] === 'string' && v[0] !== '')
      return v[0];
    return undefined;
  };

  const raw = {
    search: get('search'),
    status: get('status'),
    brand: get('brand'),
    yearMin: get('yearMin') != null ? Number(get('yearMin')) : undefined,
    yearMax: get('yearMax') != null ? Number(get('yearMax')) : undefined,
    priceMin: get('priceMin') != null ? Number(get('priceMin')) : undefined,
    priceMax: get('priceMax') != null ? Number(get('priceMax')) : undefined,
    orderBy: get('orderBy'),
    orderDir: get('orderDir'),
    page: get('page') != null ? Number(get('page')) : undefined,
    pageSize: get('pageSize') != null ? Number(get('pageSize')) : undefined,
  };

  const parsed = vehicleFiltersSchema.safeParse(raw);
  return parsed.success ? parsed.data : vehicleFiltersSchema.parse({});
}

export function filtersToSearchParams(
  f: ReturnType<typeof parseVehicleFiltersFromSearchParams>,
): URLSearchParams {
  const p = new URLSearchParams();
  if (f.search) p.set('search', f.search);
  if (f.status) p.set('status', f.status);
  if (f.brand) p.set('brand', f.brand);
  if (f.yearMin != null) p.set('yearMin', String(f.yearMin));
  if (f.yearMax != null) p.set('yearMax', String(f.yearMax));
  if (f.priceMin != null) p.set('priceMin', String(f.priceMin));
  if (f.priceMax != null) p.set('priceMax', String(f.priceMax));
  p.set('orderBy', f.orderBy);
  p.set('orderDir', f.orderDir);
  p.set('page', String(f.page));
  p.set('pageSize', String(f.pageSize));
  return p;
}
