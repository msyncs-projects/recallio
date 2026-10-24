import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { getInitialSeedData } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user in PostgreSQL
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
    });

    // Populate initial seed notes (REA Framework & Tutorial) for this user in PostgreSQL
    const { rems: seedRems, cards: seedCards } = getInitialSeedData();

    await prisma.rem.createMany({
      data: seedRems.map((r) => ({
        id: r.id,
        userId: user.id,
        text: r.text,
        parentId: r.parentId,
        childrenIds: r.childrenIds,
        type: r.type,
        isCollapsed: r.isCollapsed,
        tags: r.tags,
        isPinned: !!r.isPinned,
        isTodo: !!r.isTodo,
        isCompleted: !!r.isCompleted,
        createdAt: BigInt(r.createdAt),
        updatedAt: BigInt(r.updatedAt),
      })),
    });

    await prisma.card.createMany({
      data: seedCards.map((c) => ({
        id: c.id,
        userId: user.id,
        remId: c.remId,
        type: c.type,
        front: c.front,
        back: c.back,
        clozeIndex: c.clozeIndex ?? null,
        state: c.state,
        nextPracticeDate: BigInt(c.nextPracticeDate),
        interval: c.interval,
        easeFactor: c.easeFactor,
        repetitions: c.repetitions,
        lapses: c.lapses,
        lastPracticed: c.lastPracticed ? BigInt(c.lastPracticed) : null,
      })),
    });

    // Sign session token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set HTTP-Only Cookie
    response.cookies.set({
      name: 'mnemoflow_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration' },
      { status: 500 }
    );
  }
}
