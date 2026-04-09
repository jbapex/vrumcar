import { z } from 'zod';

export const vehicleStatusEnum = z.enum([
  'AVAILABLE',
  'RESERVED',
  'SOLD',
  'IN_PREPARATION',
  'IN_MAINTENANCE',
  'INACTIVE',
]);

export const fuelTypeEnum = z.enum([
  'GASOLINE',
  'ETHANOL',
  'FLEX',
  'DIESEL',
  'ELECTRIC',
  'HYBRID',
  'CNG',
]);

export const transmissionEnum = z.enum([
  'MANUAL',
  'AUTOMATIC',
  'CVT',
  'SEMI_AUTOMATIC',
]);

export const bodyTypeEnum = z.enum([
  'HATCH',
  'SEDAN',
  'SUV',
  'PICKUP',
  'MINIVAN',
  'COUPE',
  'CONVERTIBLE',
  'WAGON',
  'VAN',
  'OTHER',
]);

export const vehicleCategoryEnum = z.enum([
  'POPULAR',
  'MEDIUM',
  'LUXURY',
  'PREMIUM',
  'COMMERCIAL',
]);

export const vehicleCostTypeEnum = z.enum([
  'PURCHASE',
  'TRANSFER',
  'MECHANIC',
  'BODYWORK',
  'DETAILING',
  'INSPECTION',
  'PHOTOS',
  'CLEANING',
  'OTHER',
]);

export const createVehicleSchema = z.object({
  // Obrigatórios
  brand: z.string().trim().min(1, 'Marca é obrigatória').max(50),
  model: z.string().trim().min(1, 'Modelo é obrigatório').max(100),
  salePriceCents: z
    .number()
    .int()
    .positive('Preço deve ser maior que zero'),

  // Opcionais
  version: z.string().trim().max(100).optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  modelYear: z.number().int().min(1900).max(2100).optional().nullable(),
  exteriorColor: z.string().trim().max(50).optional().nullable(),
  interiorColor: z.string().trim().max(50).optional().nullable(),
  mileageKm: z.number().int().min(0).optional().nullable(),
  fuelType: fuelTypeEnum.optional().nullable(),
  transmission: transmissionEnum.optional().nullable(),
  bodyType: bodyTypeEnum.optional().nullable(),
  category: vehicleCategoryEnum.optional().nullable(),
  engineSize: z.string().trim().max(10).optional().nullable(),
  doors: z.number().int().min(2).max(6).optional().nullable(),
  licensePlate: z
    .string()
    .trim()
    .toUpperCase()
    .max(10)
    .optional()
    .nullable(),
  chassisNumber: z
    .string()
    .trim()
    .toUpperCase()
    .max(30)
    .optional()
    .nullable(),
  renavam: z.string().trim().max(20).optional().nullable(),
  fipeCode: z.string().trim().max(20).optional().nullable(),
  description: z.string().trim().max(5000).optional().nullable(),
  optionals: z.array(z.string().trim().max(100)).default([]),
  notes: z.string().trim().max(5000).optional().nullable(),

  // Custos
  acquisitionCostCents: z
    .number()
    .int()
    .min(0)
    .optional()
    .nullable(),
  minPriceCents: z.number().int().min(0).optional().nullable(),

  // Status
  status: vehicleStatusEnum.default('AVAILABLE'),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const vehicleFiltersSchema = z.object({
  search: z.string().trim().optional(),
  status: vehicleStatusEnum.optional(),
  brand: z.string().trim().optional(),
  yearMin: z.number().int().optional(),
  yearMax: z.number().int().optional(),
  priceMin: z.number().int().optional(),
  priceMax: z.number().int().optional(),
  orderBy: z
    .enum([
      'createdAt',
      'updatedAt',
      'salePriceCents',
      'brand',
      'year',
      'mileageKm',
    ])
    .default('createdAt'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const addVehicleCostSchema = z.object({
  type: vehicleCostTypeEnum,
  description: z.string().trim().min(1).max(200),
  amountCents: z.number().int().positive(),
  occurredAt: z.date().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleFilters = z.infer<typeof vehicleFiltersSchema>;
export type AddVehicleCostInput = z.infer<typeof addVehicleCostSchema>;
