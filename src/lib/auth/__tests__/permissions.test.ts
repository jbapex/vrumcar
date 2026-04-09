import { OrgRole } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  PermissionError,
  assertCan,
  can,
  type Action,
  type PermissionMatrix,
  type Resource,
  PERMISSIONS,
} from '../permissions';

const ALL_RESOURCES: Resource[] = [
  'vehicle',
  'lead',
  'deal',
  'customer',
  'sale',
  'user',
  'whatsapp',
  'automation',
  'billing',
  'settings',
  'reports',
];

const ALL_ACTIONS: Action[] = [
  'read',
  'create',
  'update',
  'delete',
  'manage',
];

describe('RBAC permissions', () => {
  it('OWNER pode tudo em todos os recursos', () => {
    for (const resource of ALL_RESOURCES) {
      for (const action of ALL_ACTIONS) {
        expect(can(OrgRole.OWNER, resource, action)).toBe(true);
      }
    }
  });

  it('ADMIN pode tudo EXCETO manage billing', () => {
    expect(can(OrgRole.ADMIN, 'billing', 'read')).toBe(true);
    expect(can(OrgRole.ADMIN, 'billing', 'update')).toBe(false);
    expect(can(OrgRole.ADMIN, 'billing', 'manage')).toBe(false);
    expect(can(OrgRole.ADMIN, 'vehicle', 'manage')).toBe(true);
  });

  it('MANAGER pode manage vehicles mas não pode manage users', () => {
    expect(can(OrgRole.MANAGER, 'vehicle', 'manage')).toBe(true);
    expect(can(OrgRole.MANAGER, 'user', 'manage')).toBe(false);
    expect(can(OrgRole.MANAGER, 'user', 'read')).toBe(true);
  });

  it('SALES pode create lead mas não pode delete lead', () => {
    expect(can(OrgRole.SALES, 'lead', 'create')).toBe(true);
    expect(can(OrgRole.SALES, 'lead', 'delete')).toBe(false);
  });

  it('SALES NÃO pode manage vehicles (só read)', () => {
    expect(can(OrgRole.SALES, 'vehicle', 'read')).toBe(true);
    expect(can(OrgRole.SALES, 'vehicle', 'manage')).toBe(false);
    expect(can(OrgRole.SALES, 'vehicle', 'update')).toBe(false);
  });

  it('FINANCE pode manage sale mas não pode update vehicle', () => {
    expect(can(OrgRole.FINANCE, 'sale', 'manage')).toBe(true);
    expect(can(OrgRole.FINANCE, 'vehicle', 'update')).toBe(false);
    expect(can(OrgRole.FINANCE, 'vehicle', 'read')).toBe(true);
  });

  it('FINANCE pode read billing', () => {
    expect(can(OrgRole.FINANCE, 'billing', 'read')).toBe(true);
  });

  it('VIEWER só pode read, nunca create/update/delete em nada', () => {
    const mutating: Action[] = ['create', 'update', 'delete', 'manage'];
    for (const resource of ALL_RESOURCES) {
      for (const action of mutating) {
        expect(can(OrgRole.VIEWER, resource, action)).toBe(false);
      }
    }
    expect(can(OrgRole.VIEWER, 'vehicle', 'read')).toBe(true);
  });

  it('manage implica read, create, update, delete', () => {
    const specific: Action[] = ['read', 'create', 'update', 'delete'];
    for (const action of specific) {
      expect(can(OrgRole.OWNER, 'vehicle', action)).toBe(true);
    }
  });

  it('assertCan não lança quando permitido', () => {
    expect(() =>
      assertCan(OrgRole.OWNER, 'vehicle', 'read'),
    ).not.toThrow();
  });

  it('assertCan lança PermissionError quando não permitido', () => {
    expect(() =>
      assertCan(OrgRole.VIEWER, 'vehicle', 'create'),
    ).toThrow(PermissionError);
  });

  it('PermissionError tem role, resource, action como campos públicos', () => {
    try {
      assertCan(OrgRole.SALES, 'vehicle', 'delete');
    } catch (e) {
      expect(e).toBeInstanceOf(PermissionError);
      const err = e as PermissionError;
      expect(err.role).toBe(OrgRole.SALES);
      expect(err.resource).toBe('vehicle');
      expect(err.action).toBe('delete');
      return;
    }
    expect.fail('deveria lançar');
  });

  it('PermissionError.message contém info útil (role, action, resource)', () => {
    try {
      assertCan(OrgRole.FINANCE, 'billing', 'manage');
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toMatch(/FINANCE/);
      expect(msg).toMatch(/billing/);
      expect(msg).toMatch(/manage/);
      return;
    }
    expect.fail('deveria lançar');
  });

  it('role inexistente em PERMISSIONS não quebra (fallback para [])', () => {
    const onlyOwner: PermissionMatrix = {
      OWNER: PERMISSIONS.OWNER,
    };
    expect(can(OrgRole.VIEWER, 'vehicle', 'read', onlyOwner)).toBe(false);
    expect(() =>
      assertCan(OrgRole.VIEWER, 'vehicle', 'read'),
    ).not.toThrow();
  });
});
