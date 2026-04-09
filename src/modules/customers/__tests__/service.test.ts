import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db';
import { createLeadSchema } from '@/modules/leads/schemas';
import { createLead } from '@/modules/leads/service';
import {
  convertLeadToCustomer,
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from '../service';
import { createCustomerSchema } from '../schemas';

describe('customers service', () => {
  const createdOrgIds: string[] = [];

  afterAll(async () => {
    try {
      if (createdOrgIds.length > 0) {
        await prisma.organization.deleteMany({
          where: { id: { in: createdOrgIds } },
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
        slug: `cust-svc-${suffix}-${t}`,
        name: `Loja Customers ${suffix} ${t}`,
      },
    });
    createdOrgIds.push(org.id);
    return org;
  }

  it('createCustomer cria com apenas name obrigatório', async () => {
    const org = await createTestOrg('min');
    const input = createCustomerSchema.parse({ name: 'Maria' });
    const c = await createCustomer(org.id, 'u1', input);
    expect(c.id).toBeDefined();
    expect(c.name).toBe('Maria');
  });

  it('createCustomer normaliza cpfCnpj (só dígitos)', async () => {
    const org = await createTestOrg('cpf');
    const input = createCustomerSchema.parse({
      name: 'Doc',
      cpfCnpj: '123.456.789-09',
    });
    expect(input.cpfCnpj).toBe('12345678909');
    const c = await createCustomer(org.id, 'u1', input);
    expect(c.cpfCnpj).toBe('12345678909');
  });

  it('updateCustomer atualiza campos e mantém outros', async () => {
    const org = await createTestOrg('upd');
    const c = await createCustomer(
      org.id,
      'u1',
      createCustomerSchema.parse({
        name: 'Full',
        phone: '11999999999',
        email: 'full@test.local',
      }),
    );
    const updated = await updateCustomer(org.id, c.id, {
      phone: '11888888888',
    });
    expect(updated.phone).toBe('11888888888');
    expect(updated.email).toBe('full@test.local');
    expect(updated.name).toBe('Full');
  });

  it('updateCustomer lança erro se customer não existe', async () => {
    const org = await createTestOrg('missing');
    await expect(
      updateCustomer(org.id, 'clxxxxxxxxxxxxxxxxx', { name: 'X' }),
    ).rejects.toThrow('Customer not found');
  });

  it('listCustomers filtra por search em name, cpfCnpj, phone, email', async () => {
    const org = await createTestOrg('search');
    const t = Date.now();
    const cpf = '52998224725';
    await createCustomer(
      org.id,
      'u1',
      createCustomerSchema.parse({
        name: 'Cliente Alfa',
        cpfCnpj: cpf,
        email: `alfa-${t}@x.com`,
      }),
    );
    const byName = await listCustomers(org.id, { search: 'Alfa' });
    expect(byName.items.length).toBeGreaterThanOrEqual(1);
    const byCpf = await listCustomers(org.id, { search: '5299822472' });
    expect(byCpf.items.some((c) => c.cpfCnpj === cpf)).toBe(true);
    const byEmail = await listCustomers(org.id, { search: `alfa-${t}` });
    expect(byEmail.items.some((c) => c.email?.includes(`alfa-${t}`))).toBe(
      true,
    );
  });

  it('listCustomers pagina corretamente', async () => {
    const org = await createTestOrg('page');
    for (let i = 0; i < 5; i++) {
      await createCustomer(
        org.id,
        'u1',
        createCustomerSchema.parse({ name: `Pag ${i}` }),
      );
    }
    const p1 = await listCustomers(org.id, { page: 1, pageSize: 2 });
    const p2 = await listCustomers(org.id, { page: 2, pageSize: 2 });
    expect(p1.items.length).toBe(2);
    expect(p2.items.length).toBe(2);
    expect(p1.total).toBeGreaterThanOrEqual(5);
    expect(p1.totalPages).toBeGreaterThanOrEqual(3);
  });

  it('deleteCustomer faz soft delete', async () => {
    const org = await createTestOrg('del');
    const c = await createCustomer(
      org.id,
      'u1',
      createCustomerSchema.parse({ name: 'Soft' }),
    );
    await deleteCustomer(org.id, c.id);
    const row = await prisma.customer.findUnique({ where: { id: c.id } });
    expect(row?.deletedAt).not.toBeNull();
  });

  it('convertLeadToCustomer cria customer a partir de lead', async () => {
    const org = await createTestOrg('conv');
    const lead = await createLead(
      org.id,
      'u1',
      createLeadSchema.parse({
        name: 'Lead Buyer',
        phone: '11911112222',
        email: 'buyer@test.local',
      }),
    );
    const cust = await convertLeadToCustomer(org.id, 'u1', lead.id);
    expect(cust.name).toBe('Lead Buyer');
    expect(cust.phone).toBe('11911112222');
  });

  it('convertLeadToCustomer atualiza lead.customerId e status=WON', async () => {
    const org = await createTestOrg('won');
    const lead = await createLead(
      org.id,
      'u1',
      createLeadSchema.parse({ name: 'Winner' }),
    );
    const cust = await convertLeadToCustomer(org.id, 'u1', lead.id);
    const refreshed = await prisma.lead.findUnique({ where: { id: lead.id } });
    expect(refreshed?.customerId).toBe(cust.id);
    expect(refreshed?.status).toBe('WON');
    expect(refreshed?.wonAt).not.toBeNull();
  });

  it('convertLeadToCustomer lança erro se lead já tem customer', async () => {
    const org = await createTestOrg('twice');
    const lead = await createLead(
      org.id,
      'u1',
      createLeadSchema.parse({ name: 'Twice' }),
    );
    await convertLeadToCustomer(org.id, 'u1', lead.id);
    await expect(
      convertLeadToCustomer(org.id, 'u1', lead.id),
    ).rejects.toThrow('Lead already has a customer');
  });
});
