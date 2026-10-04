"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { go } from "@/lib/flash";
import { clientSchema, validate, type FormState } from "@/lib/validation";

export async function createClient(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const v = validate(clientSchema, fd);
  if (!v.ok) return v.state;
  const client = await prisma.client.create({ data: v.data });
  revalidatePath("/", "layout");
  go(`/clients/${client.id}`, "ok", "Client added");
}

export async function updateClient(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const v = validate(clientSchema, fd);
  if (!v.ok) return v.state;
  await prisma.client.update({ where: { id }, data: v.data });
  revalidatePath("/", "layout");
  go(`/clients/${id}`, "ok", "Client updated");
}

export async function deleteClient(id: string, _fd: FormData) {
  await requireUser();
  await prisma.client.deleteMany({ where: { id } }); // subscriptions + payments cascade
  revalidatePath("/", "layout");
  go("/clients", "ok", "Client deleted");
}
