import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateProvider } from "@/actions/providers";
import { ProviderForm } from "@/components/simple-forms";
import { PageHeader, Panel } from "@/components/ui";
import { PLATFORM_SUGGESTIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { toInputDate, today } from "@/lib/dates";

export const metadata: Metadata = { title: "Edit provider subscription" };

export default async function EditProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.providerSubscription.findUnique({ where: { id } });
  if (!p) notFound();
  return (
    <>
      <PageHeader title={`Edit ${p.platform}`} />
      <Panel className="max-w-2xl p-5">
        <ProviderForm
          action={updateProvider.bind(null, id)}
          cancelHref="/providers"
          submitLabel="Save changes"
          todayValue={toInputDate(today())}
          platforms={PLATFORM_SUGGESTIONS}
          provider={{ ...p, purchaseDate: toInputDate(p.purchaseDate), renewalDate: toInputDate(p.renewalDate) }}
        />
      </Panel>
    </>
  );
}
