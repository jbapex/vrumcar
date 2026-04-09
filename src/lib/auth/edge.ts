import NextAuth from 'next-auth';
import authConfig from './auth.config';

/**
 * Instância Auth.js **sem** adapter/Prisma — apenas para `middleware.ts` (Edge).
 * Ver: https://authjs.dev/guides/edge-compatibility
 */
export const { auth } = NextAuth(authConfig);
