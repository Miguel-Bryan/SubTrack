import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSubscription } from "@/actions/subscriptions";
import { PageHeader, Panel } from "@/components/ui";
import { SubscriptionForm } from "@/components/subscription-form";
import { PLATFORM_SUGGESTIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { toInputDate, today } from "@/lib/dates";
import { param, type SearchParams } from "@/lib/params";

export const metadata: Metadata = { title: "Add subscription" };

export default async function NewSubscriptionPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const renewId = param(sp.renew);

  const [clients, providerPlatforms] = await Promise.all([
    prisma.client.findMany({ orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    prisma.providerSubscription.findMany({ select: { platform: true }, distinct: ["platform"] }),
  ]);
  const platforms = [...new Set([...providerPlatforms.map((p) => p.platform), ...PLATFORM_SUGGESTIONS])];
  const clientList = clients.map((c) => ({ id: c.id, name: c.fullName }));
  const now = today();

  if (renewId) {
    const old = await prisma.clientSubscription.findUnique({ where: { id: renewId }, include: { client: true } });
    if (!old) notFound();
    // Renewing early continues right after the current term; renewing late starts today.
    const start = old.endDate >= now ? old.endDate : now;
    return (
      <>
        <PageHeader title="Renew subscription" description={`${old.client.fullName} · ${old.platform} ${old.plan}. Check the details and save.`} />
        <Panel className="max-w-2xl p-5">
          <SubscriptionForm
            action={createSubscription}
            mode="renew"
            clients={clientList}
            clientName={old.client.fullName}
            platforms={platforms}
            cancelHref={`/subscriptions/${old.id}`}
            initial={{
              clientId: old.clientId,
              platform: old.platform,
              plan: old.plan,
              startDate: toInputDate(start),
              durationMonths: String(old.durationMonths),
              price: String(old.price),
              notes: "",
              renewFromId: old.id,
            }}
          />
        </Panel>
      </>
    );
  }

  const clientId = param(sp.clientId);
  return (
    <>
      <PageHeader title="Add subscription" />
      <Panel className="max-w-2xl p-5">
        <SubscriptionForm
          action={createSubscription}
          mode="create"
          clients={clientList}
          platforms={platforms}
          cancelHref={clientId ? `/clients/${clientId}` : "/subscriptions"}
          initial={{
            clientId: clients.some((c) => c.id === clientId) ? clientId : "",
            platform: "",
            plan: "",
            startDate: toInputDate(now),
            durationMonths: "1",
            price: "",
            notes: "",
          }}
        />
      </Panel>
    </>
  );
}
