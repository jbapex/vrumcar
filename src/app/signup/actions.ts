'use server';

import { signIn } from '@/lib/auth';
import {
  ConflictError,
  createOrganizationWithOwner,
} from '@/modules/organizations/service';
import { signupSchema } from '@/modules/organizations/schemas';
import { redirect, unstable_rethrow } from 'next/navigation';

export async function signupAction(formData: FormData) {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    organizationName: formData.get('organizationName'),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    redirect(
      `/signup?error=${encodeURIComponent(firstError?.message ?? 'Dados inválidos')}`,
    );
  }

  try {
    await createOrganizationWithOwner(parsed.data);
  } catch (e) {
    unstable_rethrow(e);
    if (e instanceof ConflictError) {
      redirect(`/signup?error=${encodeURIComponent(e.message)}`);
    }
    console.error('Signup error:', e);
    redirect(
      '/signup?error=' +
        encodeURIComponent('Erro interno, tente novamente'),
    );
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/dashboard',
    });
  } catch (e) {
    unstable_rethrow(e);
    throw e;
  }
}
