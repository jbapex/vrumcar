'use server';

import { signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const nextUrl = await signIn('credentials', {
    email,
    password,
    redirect: false,
    redirectTo: '/dashboard',
  });

  const url = String(nextUrl ?? '');
  if (
    url.includes('error=') ||
    url.includes('/api/auth/signin') ||
    url.includes('CredentialsSignin')
  ) {
    redirect('/login?error=CredentialsSignin');
  }

  redirect('/dashboard');
}
