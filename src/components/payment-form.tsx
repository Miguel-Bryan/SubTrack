"use client";

import { useMemo, useState } from "react";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatXAF } from "@/lib/format";
import type { FormState } from "@/lib/validation";
import { ActionForm, Field, FormActions, SelectField, TextAreaField, TextField } from "./form";

export type PaymentOption = { id: string; clientName: string; label: string; balance: number };

export function PaymentForm({
  action,
  options,
  initial,
  cancelHref,
  submitLabel,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  options: PaymentOption[];
  initial: { subscriptionId: string; amount: string; paidAt: string; method: string; reference: string; notes: string };
  cancelHref: string;
  submitLabel: string;
}) {
  const [subId, setSubId] = useState(initial.subscriptionId);
  const [amount, setAmount] = useState(initial.amount);
  const [touched, setTouched] = useState(initial.amount !== "");
  const selected = options.find((o) => o.id === subId);

  const groups = useMemo(() => {
    const map = new Map<string, PaymentOption[]>();
    for (const o of options) map.set(o.clientName, [...(map.get(o.clientName) ?? []), o]);
    return [...map.entries()];
  }, [options]);

  function pickSubscription(id: string) {
    setSubId(id);
    const next = options.find((o) => o.id === id);
    if (next && !touched) setAmount(String(next.balance));
  }

  return (
    <ActionForm action={action}>
      <Field
        name="subscriptionId"
        label="Client and subscription"
        hint={selected ? `Remaining balance: ${formatXAF(selected.balance)}` : "Only subscriptions that still have a balance are listed."}
      >
        <select id="subscriptionId" name="subscriptionId" className="input" value={subId} onChange={(e) => pickSubscription(e.target.value)} required>
          <option value="">Choose a subscription</option>
          {groups.map(([client, items]) => (
            <optgroup key={client} label={client}>
              {items.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label} ({formatXAF(o.balance)} left)
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <TextField
            name="amount"
            label="Amount (XAF)"
            inputMode="numeric"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setTouched(true);
            }}
            required
          />
          {selected && (
            <button
              type="button"
              className="mt-1 text-xs font-medium text-brand-700 hover:underline"
              onClick={() => {
                setAmount(String(selected.balance));
                setTouched(true);
              }}
            >
              Use full balance
            </button>
          )}
        </div>
        <TextField name="paidAt" label="Payment date" type="date" defaultValue={initial.paidAt} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField name="method" label="Payment method" defaultValue={initial.method} options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))} />
        <TextField name="reference" label="Reference / transaction number (optional)" defaultValue={initial.reference} />
      </div>

      <TextAreaField name="notes" label="Notes (optional)" defaultValue={initial.notes} />

      <FormActions cancelHref={cancelHref} submitLabel={submitLabel} />
    </ActionForm>
  );
}
