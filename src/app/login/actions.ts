'use server';

import { signIn } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

const NO_ORG_MSG =
  'Nenhuma organização vinculada à sua conta. Entre em contato com o suporte.';

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const nextUrl = await signIn('credentials', {
    email,
    password,
    redirect: false,
    redirectTo: '/',
  });

  const url = String(nextUrl ?? '');
  if (
    url.includes('error=') ||
    url.includes('/api/auth/signin') ||
    url.includes('CredentialsSignin')
  ) {
    redirect('/login?error=CredentialsSignin');
  }

  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    include: {
      memberships: {
        where: { isActive: true },
        take: 1,
        orderBy: { createdAt: 'asc' },
        include: { organization: true },
      },
    },
  });

  const membership = user?.memberships[0];
  if (!membership) {
    redirect(`/login?error=${encodeURIComponent(NO_ORG_MSG)}`);
  }

  redirect(`/${membership.organization.slug}/dashboard`);
}
