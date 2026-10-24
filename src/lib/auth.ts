import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'mnemoflow-super-secret-jwt-encryption-key-production-safe-2026'
);

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

/**
 * Hashes a plain text password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares plain text password with stored bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a JWT token containing user identity
 */
export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

/**
 * Verifies a JWT token and returns payload if valid
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the authenticated user from a NextRequest
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<JWTPayload | null> {
  let token: string | undefined;

  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('mnemoflow_session')?.value;
    } catch {
      // Cookies not accessible outside request context
    }
  }

  if (!token) return null;
  return verifyToken(token);
}
