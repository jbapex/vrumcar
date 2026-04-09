/**
 * Usa apenas `./lib/auth/edge` (sem Prisma no bundle Edge).
 * @see https://authjs.dev/guides/edge-compatibility
 */
export { auth as middleware } from '@/lib/auth/edge';

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};
