import { z } from 'zod';

export const leadStatusEnum = z.enum([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'VISITING',
  'NEGOTIATING',
  'WON',
  'LOST',
  'ARCHIVED',
]);

export const leadSourceEnum = z.enum([
  'WHATSAPP',
  'INSTAGRAM',
  'FACEBOOK',
  'WEBMOTORS',
  'OLX',
  'ICARROS',
  'MERCADO_LIVRE',
  'WEBSITE',
  'WALK_IN',
  'PHONE',
  'REFERRAL',
  'OTHER',
]);

export const leadPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'HOT']);

export const leadInteractionTypeEnum = z.enum([
  'NOTE',
  'PHONE_CALL',
  'WHATSAPP_SENT',
  'WHATSAPP_RECEIVED',
  'EMAIL_SENT',
  'EMAIL_RECEIVED',
  'VISIT',
  'PROPOSAL_SENT',
  'TEST_DRIVE',
  'STATUS_CHANGE',
  'ASSIGNMENT',
]);

const phoneNormalized = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 0 || (v.length >= 10 && v.length <= 13), {
    message: 'Telefone deve ter entre 10 e 13 dígitos',
  })
  .transform((v) => (v.length === 0 ? null : v))
  .optional()
  .nullable();

const cpfNormalized = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 0 || v.length === 11, {
    message: 'CPF deve ter 11 dígitos',
  })
  .transform((v) => (v.length === 0 ? null : v))
  .optional()
  .nullable();

const emailOptional = z.union([
  z.literal(''),
  z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email('Email inválido')),
]);

export const createLeadSchema = z.object({
  name: z.string().trim().min(2, 'Nome obrigatório').max(100),
  phone: phoneNormalized,
  email: emailOptional
    .transform((v) => (v === '' ? null : v))
    .optional()
    .nullable(),
  cpf: cpfNormalized,
  source: leadSourceEnum.default('OTHER'),
  sourceDetails: z.string().trim().max(200).optional().nullable(),
  status: leadStatusEnum.default('NEW'),
  priority: leadPriorityEnum.default('MEDIUM'),
  tags: z.array(z.string().trim().max(50)).default([]),
  assignedToId: z.string().optional().nullable(),
  interestVehicleId: z.string().optional().nullable(),
  interestDescription: z.string().trim().max(500).optional().nullable(),
  hasTradeIn: z.boolean().default(false),
  tradeInDescription: z.string().trim().max(500).optional().nullable(),
  budgetMinCents: z.number().int().min(0).optional().nullable(),
  budgetMaxCents: z.number().int().min(0).optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const leadFiltersSchema = z.object({
  search: z.string().trim().optional(),
  status: leadStatusEnum.optional(),
  source: leadSourceEnum.optional(),
  priority: leadPriorityEnum.optional(),
  assignedToId: z.string().optional(),
  tag: z.string().optional(),
  orderBy: z
    .enum(['createdAt', 'updatedAt', 'name', 'lastContactAt', 'priority'])
    .default('createdAt'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const addInteractionSchema = z.object({
  type: leadInteractionTypeEnum,
  content: z.string().trim().min(1, 'Conteúdo obrigatório').max(5000),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadFilters = z.infer<typeof leadFiltersSchema>;
export type AddInteractionInput = z.infer<typeof addInteractionSchema>;
