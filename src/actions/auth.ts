"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session";
import { loginSchema, validate, type FormState } from "@/lib/validation";

// Compared against when the username doesn't exist, so response time doesn't reveal valid usernames.
let dummyHash: string | undefined;

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const v = validate(loginSchema, fd);
  if (!v.ok) return { error: "Enter your username and password.", values: { username: v.state.values?.username ?? "" } };

  // usernames are stored lowercase
  const candidate = await prisma.user.findUnique({ where: { username: v.data.username.toLowerCase() } });
  dummyHash ??= bcrypt.hashSync("not-a-real-password", 10);
  const ok = await bcrypt.compare(v.data.password, candidate?.passwordHash ?? dummyHash);
  if (!candidate || !ok) {
    return { error: "Wrong username or password.", values: { username: v.data.username } };
  }

  (await cookies()).set(SESSION_COOKIE, await signSession(candidate.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
