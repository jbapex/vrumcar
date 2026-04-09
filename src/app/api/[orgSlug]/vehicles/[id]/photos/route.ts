import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { addVehiclePhoto } from '@/modules/vehicles/service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orgSlug, id: vehicleId } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      memberships: {
        where: { userId: session.user.id, isActive: true },
        take: 1,
      },
    },
  });
  if (!org || org.memberships.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only images are allowed' },
        { status: 400 },
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large (max 10MB)' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const photo = await addVehiclePhoto(org.id, vehicleId, {
      buffer,
      mimeType: file.type,
      originalName: file.name,
      sizeBytes: file.size,
    });

    return NextResponse.json({ ok: true, photo });
  } catch (err) {
    console.error('[vehicles/photos/upload]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
