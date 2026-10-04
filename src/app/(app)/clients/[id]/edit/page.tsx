import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateClient } from "@/actions/clients";
import { ClientForm } from "@/components/simple-forms";
import { PageHeader, Panel } from "@/components/ui";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Edit client" };

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();
  return (
    <>
      <PageHeader title={`Edit ${client.fullName}`} />
      <Panel className="max-w-2xl p-5">
        <ClientForm action={updateClient.bind(null, id)} cancelHref={`/clients/${id}`} submitLabel="Save changes" client={client} />
      </Panel>
    </>
  );
}
