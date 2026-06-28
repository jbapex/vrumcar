import { hash } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/invite/accept
 * Body: { token, name, password }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, name, password } = body;

    if (!token || !name?.trim() || !password) {
      return NextResponse.json(
        { error: 'Token, nome e senha são obrigatórios' },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 },
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Convite não encontrado' },
        { status: 404 },
      );
    }

    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: 'Este convite já foi aceito' },
        { status: 400 },
      );
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: 'Este convite expirou' },
        { status: 400 },
      );
    }

    let user = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    const passwordHash = await hash(password, 12);

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: invitation.email,
          passwordHash,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name.trim(),
          passwordHash,
        },
      });
    }

    const existingMembership = await prisma.membership.findFirst({
      where: {
        organizationId: invitation.organizationId,
        userId: user.id,
      },
    });

    if (existingMembership) {
      if (!existingMembership.isActive) {
        await prisma.membership.update({
          where: { id: existingMembership.id },
          data: {
            isActive: true,
            role: invitation.role,
          },
        });
      }
    } else {
      await prisma.membership.create({
        data: {
          organizationId: invitation.organizationId,
          userId: user.id,
          role: invitation.role,
          invitedById: invitation.invitedById,
        },
      });
    }

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[invite/accept]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
