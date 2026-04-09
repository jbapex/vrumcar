import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(72, 'Senha muito longa'),
  organizationName: z
    .string()
    .min(2, 'Nome da loja deve ter pelo menos 2 caracteres')
    .max(100),
});

export type SignupInput = z.infer<typeof signupSchema>;
