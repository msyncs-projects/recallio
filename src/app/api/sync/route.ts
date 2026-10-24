import { NextRequest, NextResponse } from 'next/server';
import { prisma, isPrismaConnectionError } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { Rem, Card } from '@/types';

// Pull user's data from PostgreSQL
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [dbRems, dbCards] = await Promise.all([
      prisma.rem.findMany({
        where: { userId: authUser.userId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.card.findMany({
        where: { userId: authUser.userId },
      }),
    ]);

    // Format BigInt back to numbers
    const rems: Rem[] = dbRems.map((r) => ({
      id: r.id,
      text: r.text,
      parentId: r.parentId,
      childrenIds: r.childrenIds,
      type: r.type as Rem['type'],
      isCollapsed: r.isCollapsed,
      tags: r.tags,
      isPinned: r.isPinned,
      isTodo: r.isTodo,
      isCompleted: r.isCompleted,
      createdAt: Number(r.createdAt),
      updatedAt: Number(r.updatedAt),
    }));

    const cards: Card[] = dbCards.map((c) => ({
      id: c.id,
      remId: c.remId,
      type: c.type as Card['type'],
      front: c.front,
      back: c.back,
      clozeIndex: c.clozeIndex ?? undefined,
      state: c.state as Card['state'],
      nextPracticeDate: Number(c.nextPracticeDate),
      interval: c.interval,
      easeFactor: c.easeFactor,
      repetitions: c.repetitions,
      lapses: c.lapses,
      lastPracticed: c.lastPracticed ? Number(c.lastPracticed) : undefined,
      history: (c.history as Card['history']) || [],
    }));

    return NextResponse.json({ rems, cards, syncedAt: Date.now() });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'digest' in error &&
      (error as { digest: string }).digest === 'NEXT_PRERENDER_INTERRUPTED'
    ) {
      throw error;
    }
    if (isPrismaConnectionError(error)) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }
    console.error('Error fetching sync data:', error);
    return NextResponse.json({ error: 'Failed to sync data from cloud' }, { status: 500 });
  }
}

// Push local data updates to PostgreSQL
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rems, cards }: { rems: Rem[]; cards: Card[] } = await req.json();

    if (!Array.isArray(rems) || !Array.isArray(cards)) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    // Execute in a transaction for data consistency
    await prisma.$transaction(async (tx) => {
      // 1. Delete obsolete records no longer in client
      const incomingRemIds = rems.map((r) => r.id);
      const incomingCardIds = cards.map((c) => c.id);

      await tx.card.deleteMany({
        where: {
          userId: authUser.userId,
          id: { notIn: incomingCardIds },
        },
      });

      await tx.rem.deleteMany({
        where: {
          userId: authUser.userId,
          id: { notIn: incomingRemIds },
        },
      });

      // 2. Upsert Rems with strict ownership verification (IDOR protection)
      for (const rem of rems) {
        const existingRem = await tx.rem.findUnique({
          where: { id: rem.id },
          select: { userId: true },
        });

        if (existingRem && existingRem.userId !== authUser.userId) {
          // Cross-tenant protection: prevent overwriting another user's note
          continue;
        }

        await tx.rem.upsert({
          where: { id: rem.id },
          create: {
            id: rem.id,
            userId: authUser.userId,
            text: rem.text,
            parentId: rem.parentId,
            childrenIds: rem.childrenIds || [],
            type: rem.type,
            isCollapsed: rem.isCollapsed,
            tags: rem.tags || [],
            isPinned: !!rem.isPinned,
            isTodo: !!rem.isTodo,
            isCompleted: !!rem.isCompleted,
            createdAt: BigInt(rem.createdAt),
            updatedAt: BigInt(rem.updatedAt),
          },
          update: {
            text: rem.text,
            parentId: rem.parentId,
            childrenIds: rem.childrenIds || [],
            type: rem.type,
            isCollapsed: rem.isCollapsed,
            tags: rem.tags || [],
            isPinned: !!rem.isPinned,
            isTodo: !!rem.isTodo,
            isCompleted: !!rem.isCompleted,
            updatedAt: BigInt(rem.updatedAt),
          },
        });
      }

      // 3. Upsert Cards with strict ownership verification (IDOR protection)
      for (const card of cards) {
        const existingCard = await tx.card.findUnique({
          where: { id: card.id },
          select: { userId: true },
        });

        if (existingCard && existingCard.userId !== authUser.userId) {
          // Cross-tenant protection: prevent overwriting another user's card
          continue;
        }

        await tx.card.upsert({
          where: { id: card.id },
          create: {
            id: card.id,
            userId: authUser.userId,
            remId: card.remId,
            type: card.type,
            front: card.front,
            back: card.back,
            clozeIndex: card.clozeIndex ?? null,
            state: card.state,
            nextPracticeDate: BigInt(card.nextPracticeDate),
            interval: card.interval,
            easeFactor: card.easeFactor,
            repetitions: card.repetitions,
            lapses: card.lapses,
            lastPracticed: card.lastPracticed ? BigInt(card.lastPracticed) : null,
            history: (card.history as object) || [],
          },
          update: {
            front: card.front,
            back: card.back,
            clozeIndex: card.clozeIndex ?? null,
            state: card.state,
            nextPracticeDate: BigInt(card.nextPracticeDate),
            interval: card.interval,
            easeFactor: card.easeFactor,
            repetitions: card.repetitions,
            lapses: card.lapses,
            lastPracticed: card.lastPracticed ? BigInt(card.lastPracticed) : null,
            history: (card.history as object) || [],
          },
        });
      }
    });

    return NextResponse.json({ success: true, count: rems.length, syncedAt: Date.now() });
  } catch (error) {
    console.error('Error in sync endpoint:', error);
    if (isPrismaConnectionError(error)) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to synchronize with database' }, { status: 500 });
  }
}
