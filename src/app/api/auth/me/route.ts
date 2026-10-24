import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);

    if (!authUser) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            rems: true,
            cards: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
        totalRems: user._count.rems,
        totalCards: user._count.cards,
      },
    });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'digest' in error &&
      (error as { digest: string }).digest === 'NEXT_PRERENDER_INTERRUPTED'
    ) {
      throw error;
    }
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ user: null });
  }
}
