import type { Metadata } from "next";
import { createPayment } from "@/actions/payments";
import { PaymentForm } from "@/components/payment-form";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import Link from "next/link";
import { toInputDate, today } from "@/lib/dates";
import { param, type SearchParams } from "@/lib/params";
import { getPaymentOptions } from "@/lib/queries";

export const metadata: Metadata = { title: "Record payment" };

export default async function NewPaymentPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const options = await getPaymentOptions();
  const wanted = options.find((o) => o.id === param(sp.subscriptionId));

  return (
    <>
      <PageHeader title="Record payment" />
      <Panel className="max-w-2xl p-5">
        {options.length === 0 ? (
          <EmptyState title="Nothing to pay" text="Every subscription is fully paid. Add a subscription first." action={<Link href="/subscriptions/new" className="btn-primary">Add subscription</Link>} />
        ) : (
          <PaymentForm
            action={createPayment}
            options={options}
            cancelHref={wanted ? `/subscriptions/${wanted.id}` : "/payments"}
            submitLabel="Record payment"
            initial={{
              subscriptionId: wanted?.id ?? "",
              amount: wanted ? String(wanted.balance) : "",
              paidAt: toInputDate(today()),
              method: "MTN MoMo",
              reference: "",
              notes: "",
            }}
          />
        )}
      </Panel>
    </>
  );
}
