import { leadFiltersSchema, type LeadFilters } from './schemas';

function first(
  v: string | string[] | undefined,
): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function emptyToUndef(s: string | undefined): string | undefined {
  if (!s?.trim()) return undefined;
  return s;
}

/**
 * Converte query string da listagem de leads em filtros validados.
 */
export function parseLeadFiltersFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
): LeadFilters {
  const get = (k: string) => first(sp[k]);

  const pageRaw = get('page');
  const page = pageRaw ? Math.max(1, parseInt(pageRaw, 10) || 1) : undefined;

  const pageSizeRaw = get('pageSize');
  const pageSize = pageSizeRaw
    ? Math.min(100, Math.max(1, parseInt(pageSizeRaw, 10) || 20))
    : undefined;

  const raw = {
    search: emptyToUndef(get('search')?.trim()),
    status: emptyToUndef(get('status')) as LeadFilters['status'] | undefined,
    source: emptyToUndef(get('source')) as LeadFilters['source'] | undefined,
    priority: emptyToUndef(get('priority')) as
      | LeadFilters['priority']
      | undefined,
    assignedToId: emptyToUndef(get('assignedToId')),
    tag: emptyToUndef(get('tag')),
    orderBy: emptyToUndef(get('orderBy')) as LeadFilters['orderBy'] | undefined,
    orderDir: emptyToUndef(get('orderDir')) as
      | LeadFilters['orderDir']
      | undefined,
    page,
    pageSize,
  };

  const parsed = leadFiltersSchema.safeParse(raw);
  return parsed.success ? parsed.data : leadFiltersSchema.parse({});
}

export function leadFiltersToSearchParams(f: LeadFilters): URLSearchParams {
  const q = new URLSearchParams();
  if (f.search) q.set('search', f.search);
  if (f.status) q.set('status', f.status);
  if (f.source) q.set('source', f.source);
  if (f.priority) q.set('priority', f.priority);
  if (f.assignedToId) q.set('assignedToId', f.assignedToId);
  if (f.tag) q.set('tag', f.tag);
  q.set('orderBy', f.orderBy);
  q.set('orderDir', f.orderDir);
  q.set('page', String(f.page));
  q.set('pageSize', String(f.pageSize));
  return q;
}
