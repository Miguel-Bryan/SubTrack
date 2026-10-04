import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateSubscription } from "@/actions/subscriptions";
import { PageHeader, Panel } from "@/components/ui";
import { SubscriptionForm } from "@/components/subscription-form";
import { PLATFORM_SUGGESTIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { toInputDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Edit subscription" };

export default async function EditSubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sub = await prisma.clientSubscription.findUnique({ where: { id }, include: { client: true } });
  if (!sub) notFound();
  return (
    <>
      <PageHeader title="Edit subscription" description={`${sub.client.fullName} · ${sub.platform}`} />
      <Panel className="max-w-2xl p-5">
        <SubscriptionForm
          action={updateSubscription.bind(null, id)}
          mode="edit"
          clients={[]}
          clientName={sub.client.fullName}
          platforms={PLATFORM_SUGGESTIONS}
          cancelHref={`/subscriptions/${id}`}
          initial={{
            clientId: sub.clientId,
            platform: sub.platform,
            plan: sub.plan,
            startDate: toInputDate(sub.startDate),
            durationMonths: String(sub.durationMonths),
            price: String(sub.price),
            notes: sub.notes ?? "",
            status: sub.status,
          }}
        />
      </Panel>
    </>
  );
}
