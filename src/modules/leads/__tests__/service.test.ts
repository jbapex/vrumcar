import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db';
import {
  addInteraction,
  createLead,
  deleteLead,
  findDuplicates,
  getLeadById,
  listLeads,
  updateLead,
} from '../service';
import {
  createLeadSchema,
  leadFiltersSchema,
} from '../schemas';

describe('leads service', () => {
  const createdOrgIds: string[] = [];
  const createdUserIds: string[] = [];

  afterAll(async () => {
    try {
      if (createdOrgIds.length > 0) {
        await prisma.organization.deleteMany({
          where: { id: { in: createdOrgIds } },
        });
      }
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
      }
    } catch {
      // DB pode estar indisponível
    }
    await prisma.$disconnect().catch(() => {});
  });

  async function createTestOrg(suffix: string) {
    const t = Date.now();
    const org = await prisma.organization.create({
      data: {
        slug: `lead-svc-${suffix}-${t}`,
        name: `Loja Leads ${suffix} ${t}`,
      },
    });
    createdOrgIds.push(org.id);
    return org;
  }

  async function createUserWithMembership(
    orgId: string,
    role: 'SALES' | 'MANAGER',
    label: string,
  ) {
    const t = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `lead-${label}-${t}@test.local`,
        name: `${label} ${t}`,
      },
    });
    createdUserIds.push(user.id);
    await prisma.membership.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        role,
      },
    });
    return user;
  }

  describe('createLead', () => {
    it('cria lead com apenas name obrigatório', async () => {
      const org = await createTestOrg('minimal');
      const input = createLeadSchema.parse({ name: 'João Silva' });
      const lead = await createLead(org.id, 'creator-1', input);
      expect(lead.id).toBeDefined();
      expect(lead.name).toBe('João Silva');
    });

    it('normaliza telefone (remove caracteres não-dígitos)', async () => {
      const org = await createTestOrg('phone');
      const t = Date.now();
      const input = createLeadSchema.parse({
        name: 'Tel Test',
        phone: `(11) 98765-${String(t).slice(-4)}`,
      });
      expect(input.phone).toMatch(/^\d{10,13}$/);
      const lead = await createLead(org.id, 'u1', input);
      expect(lead.phone).toBe(input.phone);
    });

    it('normaliza email (lowercase + trim)', async () => {
      const org = await createTestOrg('email');
      const t = Date.now();
      const input = createLeadSchema.parse({
        name: 'Email Test',
        email: `  TestUser+${t}@EXAMPLE.COM  `,
      });
      expect(input.email).toBe(`testuser+${t}@example.com`);
      const lead = await createLead(org.id, 'u1', input);
      expect(lead.email).toBe(input.email);
    });

    it('cria interação automática de criação', async () => {
      const org = await createTestOrg('note');
      const input = createLeadSchema.parse({
        name: 'Timeline',
        source: 'WHATSAPP',
      });
      const lead = await createLead(org.id, 'u1', input);
      const rows = await prisma.leadInteraction.findMany({
        where: { leadId: lead.id, organizationId: org.id },
      });
      expect(rows.some((r) => r.type === 'NOTE' && r.content.includes('WHATSAPP'))).toBe(
        true,
      );
    });
  });

  describe('findDuplicates', () => {
    it('retorna vazio quando não há match', async () => {
      const org = await createTestOrg('dup-empty');
      const d = await findDuplicates(org.id, {
        phone: '99999999999',
        email: 'none@none.local',
      });
      expect(d).toEqual([]);
    });

    it('encontra por telefone', async () => {
      const org = await createTestOrg('dup-phone');
      const t = Date.now();
      const phone = `1198765${String(t).slice(-4)}`;
      const input = createLeadSchema.parse({ name: 'Dup A', phone });
      await createLead(org.id, 'u1', input);
      const d = await findDuplicates(org.id, { phone });
      expect(d).toHaveLength(1);
      expect(d[0].matchedOn).toBe('phone');
    });

    it('encontra por email', async () => {
      const org = await createTestOrg('dup-email');
      const t = Date.now();
      const email = `dup-${t}@test.local`;
      const input = createLeadSchema.parse({ name: 'Dup B', email });
      await createLead(org.id, 'u1', input);
      const d = await findDuplicates(org.id, { email });
      expect(d).toHaveLength(1);
      expect(d[0].matchedOn).toBe('email');
    });

    it('não duplica resultados quando mesmo lead bate por phone e email', async () => {
      const org = await createTestOrg('dup-both');
      const t = Date.now();
      const phone = `2199988${String(t).slice(-4)}`;
      const email = `same-${t}@test.local`;
      const input = createLeadSchema.parse({
        name: 'Dup C',
        phone,
        email,
      });
      await createLead(org.id, 'u1', input);
      const d = await findDuplicates(org.id, { phone, email });
      expect(d).toHaveLength(1);
    });
  });

  describe('updateLead', () => {
    it('cria interaction STATUS_CHANGE quando status muda', async () => {
      const org = await createTestOrg('st-chg');
      const input = createLeadSchema.parse({ name: 'Status' });
      const lead = await createLead(org.id, 'u1', input);
      const before = await prisma.leadInteraction.count({
        where: { leadId: lead.id },
      });
      await updateLead(org.id, 'u1', lead.id, { status: 'CONTACTED' });
      const after = await prisma.leadInteraction.count({
        where: { leadId: lead.id },
      });
      expect(after).toBeGreaterThan(before);
      const last = await prisma.leadInteraction.findFirst({
        where: { leadId: lead.id, type: 'STATUS_CHANGE' },
        orderBy: { createdAt: 'desc' },
      });
      expect(last?.content).toContain('NEW');
      expect(last?.content).toContain('CONTACTED');
    });

    it('não cria STATUS_CHANGE quando status não muda', async () => {
      const org = await createTestOrg('st-same');
      const input = createLeadSchema.parse({ name: 'Same' });
      const lead = await createLead(org.id, 'u1', input);
      const before = await prisma.leadInteraction.count({
        where: { leadId: lead.id, type: 'STATUS_CHANGE' },
      });
      await updateLead(org.id, 'u1', lead.id, { priority: 'HIGH' });
      const after = await prisma.leadInteraction.count({
        where: { leadId: lead.id, type: 'STATUS_CHANGE' },
      });
      expect(after).toBe(before);
    });

    it('cria interaction ASSIGNMENT quando muda assignee', async () => {
      const org = await createTestOrg('assign');
      const sales = await createUserWithMembership(org.id, 'SALES', 's');
      const input = createLeadSchema.parse({ name: 'Assign' });
      const lead = await createLead(org.id, 'u1', input);
      await updateLead(org.id, 'u1', lead.id, { assignedToId: sales.id });
      const ix = await prisma.leadInteraction.findFirst({
        where: { leadId: lead.id, type: 'ASSIGNMENT' },
        orderBy: { createdAt: 'desc' },
      });
      expect(ix).not.toBeNull();
    });
  });

  describe('getLeadById', () => {
    it('com role SALES retorna lead se assignedToId bate com userId', async () => {
      const org = await createTestOrg('own-ok');
      const sales = await createUserWithMembership(org.id, 'SALES', 's');
      const input = createLeadSchema.parse({
        name: 'Mine',
        assignedToId: sales.id,
      });
      const lead = await createLead(org.id, 'other', input);
      const got = await getLeadById(org.id, lead.id, {
        userId: sales.id,
        role: 'SALES',
      });
      expect(got?.id).toBe(lead.id);
    });

    it('com role SALES retorna null se assignedToId NÃO bate (ownership)', async () => {
      const org = await createTestOrg('own-bad');
      const salesA = await createUserWithMembership(org.id, 'SALES', 'a');
      const salesB = await createUserWithMembership(org.id, 'SALES', 'b');
      const input = createLeadSchema.parse({
        name: 'Not mine',
        assignedToId: salesA.id,
      });
      const lead = await createLead(org.id, 'u1', input);
      const got = await getLeadById(org.id, lead.id, {
        userId: salesB.id,
        role: 'SALES',
      });
      expect(got).toBeNull();
    });

    it('com role MANAGER retorna qualquer lead da org', async () => {
      const org = await createTestOrg('mgr');
      const sales = await createUserWithMembership(org.id, 'SALES', 's');
      const manager = await createUserWithMembership(org.id, 'MANAGER', 'm');
      const input = createLeadSchema.parse({
        name: 'Any',
        assignedToId: sales.id,
      });
      const lead = await createLead(org.id, 'u1', input);
      const got = await getLeadById(org.id, lead.id, {
        userId: manager.id,
        role: 'MANAGER',
      });
      expect(got?.id).toBe(lead.id);
    });
  });

  describe('listLeads', () => {
    it('com role SALES filtra automaticamente por assignedToId', async () => {
      const org = await createTestOrg('list-sales');
      const salesA = await createUserWithMembership(org.id, 'SALES', 'la');
      const salesB = await createUserWithMembership(org.id, 'SALES', 'lb');
      const i1 = createLeadSchema.parse({
        name: 'L1',
        assignedToId: salesA.id,
      });
      const i2 = createLeadSchema.parse({
        name: 'L2',
        assignedToId: salesB.id,
      });
      await createLead(org.id, 'u1', i1);
      await createLead(org.id, 'u1', i2);
      const filters = leadFiltersSchema.parse({});
      const r = await listLeads(org.id, filters, {
        userId: salesA.id,
        role: 'SALES',
      });
      expect(r.items.every((l) => l.assignedToId === salesA.id)).toBe(true);
      expect(r.items.some((l) => l.name === 'L1')).toBe(true);
      expect(r.items.some((l) => l.name === 'L2')).toBe(false);
    });

    it('com role MANAGER retorna todos os leads da org', async () => {
      const org = await createTestOrg('list-mgr');
      const salesA = await createUserWithMembership(org.id, 'SALES', 'ma');
      const salesB = await createUserWithMembership(org.id, 'SALES', 'mb');
      const mgr = await createUserWithMembership(org.id, 'MANAGER', 'mm');
      await createLead(
        org.id,
        'u1',
        createLeadSchema.parse({ name: 'M1', assignedToId: salesA.id }),
      );
      await createLead(
        org.id,
        'u1',
        createLeadSchema.parse({ name: 'M2', assignedToId: salesB.id }),
      );
      const filters = leadFiltersSchema.parse({});
      const r = await listLeads(org.id, filters, {
        userId: mgr.id,
        role: 'MANAGER',
      });
      expect(r.items.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('addInteraction', () => {
    it('atualiza lastContactAt pra tipos de contato', async () => {
      const org = await createTestOrg('contact');
      const lead = await createLead(
        org.id,
        'u1',
        createLeadSchema.parse({ name: 'LC' }),
      );
      await addInteraction(org.id, 'u1', lead.id, {
        type: 'PHONE_CALL',
        content: 'Ligou',
      });
      const updated = await prisma.lead.findUnique({ where: { id: lead.id } });
      expect(updated?.lastContactAt).not.toBeNull();
    });

    it('NÃO atualiza lastContactAt pra tipo NOTE', async () => {
      const org = await createTestOrg('note-lc');
      const lead = await createLead(
        org.id,
        'u1',
        createLeadSchema.parse({ name: 'NLC' }),
      );
      await addInteraction(org.id, 'u1', lead.id, {
        type: 'NOTE',
        content: 'Só nota',
      });
      const updated = await prisma.lead.findUnique({ where: { id: lead.id } });
      expect(updated?.lastContactAt).toBeNull();
    });
  });

  describe('deleteLead', () => {
    it('faz soft delete', async () => {
      const org = await createTestOrg('soft');
      const lead = await createLead(
        org.id,
        'u1',
        createLeadSchema.parse({ name: 'Del' }),
      );
      await deleteLead(org.id, lead.id);
      const row = await prisma.lead.findUnique({ where: { id: lead.id } });
      expect(row?.deletedAt).not.toBeNull();
    });
  });

  describe('listLeads deleted', () => {
    it('não retorna leads deletados', async () => {
      const org = await createTestOrg('no-del');
      const mgr = await createUserWithMembership(org.id, 'MANAGER', 'md');
      const alive = await createLead(
        org.id,
        'u1',
        createLeadSchema.parse({ name: 'Alive' }),
      );
      const dead = await createLead(
        org.id,
        'u1',
        createLeadSchema.parse({ name: 'Dead' }),
      );
      await deleteLead(org.id, dead.id);
      const filters = leadFiltersSchema.parse({ search: 'Alive' });
      const r = await listLeads(org.id, filters, {
        userId: mgr.id,
        role: 'MANAGER',
      });
      expect(r.items.some((l) => l.id === alive.id)).toBe(true);
      expect(r.items.some((l) => l.id === dead.id)).toBe(false);
    });
  });
});
