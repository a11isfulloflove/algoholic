import { SignJWT, jwtVerify } from 'jose'

export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

export interface SessionPayload {
  userId: number
}

function getSessionSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set')
  }
  return new TextEncoder().encode(secret)
}

export function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret())
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret())
    if (typeof payload.userId !== 'number') {
      return null
    }
    return { userId: payload.userId }
  } catch {
    return null
  }
}
