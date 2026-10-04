// Edge-safe session helpers (used by middleware and by server code).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "subtrack_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short. Set it in your .env file (see .env.example).");
  }
  if (process.env.NODE_ENV === "production" && value.startsWith("change-me")) {
    throw new Error("AUTH_SECRET still has the placeholder value. Generate a real secret before deploying.");
  }
  return new TextEncoder().encode(value);
}

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string): Promise<{ uid: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.uid === "string" ? { uid: payload.uid } : null;
  } catch {
    return null;
  }
}
