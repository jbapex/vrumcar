import { z } from 'zod';

export const paymentMethodEnum = z.enum([
  'CASH',
  'BANK_TRANSFER',
  'DEBIT_CARD',
  'CREDIT_CARD',
  'FINANCING',
  'CONSORTIUM',
  'TRADE_IN_ONLY',
  'MIXED',
]);

export const saleStatusEnum = z.enum(['PENDING', 'COMPLETED', 'CANCELLED']);

export const registerSaleSchema = z.object({
  vehicleId: z.string().min(1, 'Veículo obrigatório'),
  salesPersonId: z.string().min(1, 'Vendedor obrigatório'),
  finalPriceCents: z
    .number()
    .int()
    .positive('Preço final deve ser maior que zero'),
  paymentMethod: paymentMethodEnum,

  leadId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),

  paymentNotes: z.string().trim().max(2000).optional().nullable(),

  hasTradeIn: z.boolean().default(false),
  tradeInBrand: z.string().trim().max(50).optional().nullable(),
  tradeInModel: z.string().trim().max(100).optional().nullable(),
  tradeInYear: z.number().int().min(1900).max(2100).optional().nullable(),
  tradeInMileageKm: z.number().int().min(0).optional().nullable(),
  tradeInPlate: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return null;
      return String(v).trim().toUpperCase();
    },
    z.union([z.null(), z.string().max(10)]),
  ).optional(),
  tradeInValueCents: z.number().int().min(0).optional().nullable(),
  tradeInNotes: z.string().trim().max(2000).optional().nullable(),

  contractNumber: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  soldAt: z.coerce.date().optional(),
});

export const cancelSaleSchema = z.object({
  reason: z.string().trim().min(3, 'Motivo obrigatório').max(500),
});

export const saleFiltersSchema = z.object({
  search: z.string().trim().optional(),
  status: saleStatusEnum.optional(),
  salesPersonId: z.string().optional(),
  paymentMethod: paymentMethodEnum.optional(),
  soldAfter: z.coerce.date().optional(),
  soldBefore: z.coerce.date().optional(),
  orderBy: z
    .enum(['soldAt', 'createdAt', 'finalPriceCents'])
    .default('soldAt'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type RegisterSaleInput = z.infer<typeof registerSaleSchema>;
export type CancelSaleInput = z.infer<typeof cancelSaleSchema>;
export type SaleFilters = z.infer<typeof saleFiltersSchema>;
