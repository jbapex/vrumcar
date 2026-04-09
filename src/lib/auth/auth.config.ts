import type { NextAuthConfig } from 'next-auth';
import Resend from 'next-auth/providers/resend';

const resendKey = process.env.RESEND_API_KEY?.trim();
const emailFrom = process.env.EMAIL_FROM ?? 'noreply@vrumcar.local';

/**
 * Config partilhada sem Prisma — usada pelo middleware (Edge) para não
 * embutir o cliente de DB. Os providers aqui devem ser compatíveis com Edge
 * (ex.: Resend usa `fetch`).
 */
const optionalResend = resendKey
  ? [
      Resend({
        apiKey: resendKey,
        from: emailFrom,
      }),
    ]
  : [];

export default {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
  providers: optionalResend,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
