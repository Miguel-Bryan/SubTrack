import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updatePayment } from "@/actions/payments";
import { PaymentForm } from "@/components/payment-form";
import { PageHeader, Panel } from "@/components/ui";
import { prisma } from "@/lib/db";
import { toInputDate } from "@/lib/dates";
import { getPaymentOptions } from "@/lib/queries";

export const metadata: Metadata = { title: "Edit payment" };

export default async function EditPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) notFound();
  const options = await getPaymentOptions({ subscriptionId: payment.subscriptionId, amount: payment.amount });

  return (
    <>
      <PageHeader title="Edit payment" />
      <Panel className="max-w-2xl p-5">
        <PaymentForm
          action={updatePayment.bind(null, id)}
          options={options}
          cancelHref={`/subscriptions/${payment.subscriptionId}`}
          submitLabel="Save changes"
          initial={{
            subscriptionId: payment.subscriptionId,
            amount: String(payment.amount),
            paidAt: toInputDate(payment.paidAt),
            method: payment.method,
            reference: payment.reference ?? "",
            notes: payment.notes ?? "",
          }}
        />
      </Panel>
    </>
  );
}
