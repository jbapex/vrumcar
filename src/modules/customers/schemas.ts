import { z } from 'zod';

const cpfCnpjNormalized = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 0 || v.length === 11 || v.length === 14, {
    message: 'CPF deve ter 11 dígitos ou CNPJ 14',
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

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Nome obrigatório').max(100),
  cpfCnpj: cpfCnpjNormalized,
  rg: z.string().trim().max(20).optional().nullable(),
  birthDate: z.coerce.date().optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  phoneSecondary: z.string().trim().max(20).optional().nullable(),
  email: emailOptional
    .transform((v) => (v === '' ? null : v))
    .optional()
    .nullable(),
  addressStreet: z.string().trim().max(200).optional().nullable(),
  addressNumber: z.string().trim().max(20).optional().nullable(),
  addressComplement: z.string().trim().max(100).optional().nullable(),
  addressNeighborhood: z.string().trim().max(100).optional().nullable(),
  addressCity: z.string().trim().max(100).optional().nullable(),
  addressState: z.string().trim().max(2).optional().nullable(),
  addressZip: z.string().trim().max(10).optional().nullable(),
  occupation: z.string().trim().max(100).optional().nullable(),
  monthlyIncomeCents: z.number().int().min(0).optional().nullable(),
  employerName: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  tags: z.array(z.string().trim().max(50)).default([]),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
