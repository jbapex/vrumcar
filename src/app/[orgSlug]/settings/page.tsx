import { notFound } from 'next/navigation';
import { OrgSettingsForm } from '@/components/settings/org-settings-form';
import { prisma } from '@/lib/db';

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { orgSlug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });
  if (!org) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Dados da organização</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Gerencie nome, slug e logo.
        </p>
      </div>

      <OrgSettingsForm
        orgSlug={orgSlug}
        initialData={{
          name: org.name,
          slug: org.slug,
          logoUrl: org.logoUrl,
        }}
      />
    </div>
  );
}
