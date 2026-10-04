"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { go } from "@/lib/flash";
import { fail, userCreateSchema, userUpdateSchema, validate, type FormState } from "@/lib/validation";

export async function createUser(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const v = validate(userCreateSchema, fd);
  if (!v.ok) return v.state;

  const taken = await prisma.user.findUnique({ where: { username: v.data.username } });
  if (taken) return fail(v.values, { username: "This username is already used" });

  await prisma.user.create({
    data: {
      name: v.data.name,
      username: v.data.username,
      role: v.data.role,
      passwordHash: await bcrypt.hash(v.data.password, 10),
    },
  });
  revalidatePath("/users");
  go("/users", "ok", "User added");
}

export async function updateUser(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const v = validate(userUpdateSchema, fd);
  if (!v.ok) return v.state;

  const taken = await prisma.user.findFirst({ where: { username: v.data.username, NOT: { id } } });
  if (taken) return fail(v.values, { username: "This username is already used" });

  const current = await prisma.user.findUnique({ where: { id } });
  if (!current) go("/users", "err", "User not found");
  if (current.role === "ADMIN" && v.data.role !== "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) return fail(v.values, { role: "There must be at least one admin" });
  }

  await prisma.user.update({
    where: { id },
    data: {
      name: v.data.name,
      username: v.data.username,
      role: v.data.role,
      ...(v.data.password ? { passwordHash: await bcrypt.hash(v.data.password, 10) } : {}),
    },
  });
  revalidatePath("/", "layout");
  go("/users", "ok", id === admin.id ? "Your account was updated" : "User updated");
}

export async function deleteUser(id: string, _fd: FormData) {
  const admin = await requireAdmin();
  if (id === admin.id) go("/users", "err", "You can't delete your own account");
  const target = await prisma.user.findUnique({ where: { id } });
  if (target?.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) go("/users", "err", "There must be at least one admin");
  }
  await prisma.user.deleteMany({ where: { id } });
  revalidatePath("/users");
  go("/users", "ok", "User deleted");
}
