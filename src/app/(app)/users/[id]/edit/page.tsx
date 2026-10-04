import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateUser } from "@/actions/users";
import { UserForm } from "@/components/simple-forms";
import { PageHeader, Panel } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Edit user" };

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();
  return (
    <>
      <PageHeader title={`Edit ${user.name}`} />
      <Panel className="max-w-2xl p-5">
        <UserForm action={updateUser.bind(null, id)} cancelHref="/users" submitLabel="Save changes" user={user} />
      </Panel>
    </>
  );
}
