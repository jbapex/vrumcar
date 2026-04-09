import { type OrgRole } from '@prisma/client';

export type Resource =
  | 'vehicle'
  | 'lead'
  | 'deal'
  | 'customer'
  | 'sale'
  | 'user'
  | 'whatsapp'
  | 'automation'
  | 'billing'
  | 'settings'
  | 'reports';

export type Action = 'read' | 'create' | 'update' | 'delete' | 'manage';

/** Matriz usada por `can` quando nenhuma outra é passada (ex.: testes com matriz parcial). */
export type PermissionMatrix = Partial<
  Record<OrgRole, Partial<Record<Resource, readonly Action[]>>>
>;

/**
 * Matriz RBAC: papel × recurso × ações permitidas.
 * `manage` implica read, create, update e delete naquele recurso (via `can()`).
 * Recurso omitido ou lista vazia ⇒ nenhuma ação permitida.
 */
export const PERMISSIONS = {
  OWNER: {
    vehicle: ['manage'],
    lead: ['manage'],
    deal: ['manage'],
    customer: ['manage'],
    sale: ['manage'],
    user: ['manage'],
    whatsapp: ['manage'],
    automation: ['manage'],
    billing: ['manage'],
    settings: ['manage'],
    reports: ['manage'],
  },
  ADMIN: {
    vehicle: ['manage'],
    lead: ['manage'],
    deal: ['manage'],
    customer: ['manage'],
    sale: ['manage'],
    user: ['manage'],
    whatsapp: ['manage'],
    automation: ['manage'],
    settings: ['manage'],
    reports: ['manage'],
    billing: ['read'],
  },
  MANAGER: {
    vehicle: ['manage'],
    lead: ['manage'],
    deal: ['manage'],
    customer: ['manage'],
    sale: ['manage'],
    whatsapp: ['manage'],
    automation: ['manage'],
    reports: ['read'],
    user: ['read'],
    settings: ['read'],
  },
  SALES: {
    vehicle: ['read'],
    lead: ['read', 'create', 'update'],
    deal: ['read', 'create', 'update'],
    customer: ['read', 'create', 'update'],
    whatsapp: ['read', 'create', 'update'],
    reports: ['read'],
    sale: ['read', 'create'],
    automation: ['read'],
    user: ['read'],
  },
  FINANCE: {
    sale: ['manage'],
    customer: ['read'],
    vehicle: ['read'],
    reports: ['read'],
    billing: ['read'],
    user: ['read'],
  },
  VIEWER: {
    vehicle: ['read'],
    lead: ['read'],
    deal: ['read'],
    customer: ['read'],
    sale: ['read'],
    reports: ['read'],
    user: ['read'],
  },
} as const satisfies Record<
  OrgRole,
  Partial<Record<Resource, readonly Action[]>>
>;

/**
 * Verifica se o papel pode executar a ação no recurso.
 * @param matrix — opcional (ex.: testes com matriz parcial); omissão usa {@link PERMISSIONS}.
 */
export function can(
  role: OrgRole,
  resource: Resource,
  action: Action,
  matrix: PermissionMatrix = PERMISSIONS,
): boolean {
  const perms = matrix[role]?.[resource] ?? [];
  return perms.includes(action) || perms.includes('manage');
}

export class PermissionError extends Error {
  readonly role: OrgRole;

  readonly resource: Resource;

  readonly action: Action;

  constructor(role: OrgRole, resource: Resource, action: Action) {
    super(
      `Permission denied: role=${role} cannot ${action} ${resource}`,
    );
    this.name = 'PermissionError';
    this.role = role;
    this.resource = resource;
    this.action = action;
  }
}

export function assertCan(
  role: OrgRole,
  resource: Resource,
  action: Action,
): void {
  if (!can(role, resource, action)) {
    throw new PermissionError(role, resource, action);
  }
}
