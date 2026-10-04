"use client";

import { useState } from "react";
import { PAYMENT_METHODS, SUBSCRIPTION_STATUSES, SUBSCRIPTION_STATUS_LABELS, DURATIONS } from "@/lib/constants";
import { addMonths, formatDate, parseDateInput } from "@/lib/dates";
import type { FormState } from "@/lib/validation";
import { ActionForm, Field, FormActions, SelectField, TextAreaField, TextField } from "./form";

type Initial = {
  clientId: string;
  platform: string;
  plan: string;
  startDate: string;
  durationMonths: string;
  price: string;
  notes: string;
  status?: string;
  renewFromId?: string;
};

export function SubscriptionForm({
  action,
  mode,
  clients,
  clientName,
  platforms,
  initial,
  cancelHref,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  mode: "create" | "edit" | "renew";
  clients: { id: string; name: string }[];
  clientName?: string;
  platforms: string[];
  initial: Initial;
  cancelHref: string;
}) {
  const [start, setStart] = useState(initial.startDate);
  const [duration, setDuration] = useState(initial.durationMonths);

  const startDate = parseDateInput(start);
  const endLabel = startDate ? formatDate(addMonths(startDate, Number(duration))) : "Pick a start date";
  const lockedClient = mode !== "create";

  return (
    <ActionForm action={action}>
      {initial.renewFromId && <input type="hidden" name="renewFromId" value={initial.renewFromId} />}

      {lockedClient ? (
        <>
          <input type="hidden" name="clientId" value={initial.clientId} />
          <div>
            <p className="label">Client</p>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm">{clientName}</p>
          </div>
        </>
      ) : (
        <SelectField
          name="clientId"
          label="Client"
          defaultValue={initial.clientId}
          placeholder="Choose a client"
          options={clients.map((c) => ({ value: c.id, label: c.name }))}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <TextField name="platform" label="Platform / service" defaultValue={initial.platform} list="platform-list" placeholder="e.g. Netflix" required />
          <datalist id="platform-list">
            {platforms.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
        <TextField name="plan" label="Plan / type" defaultValue={initial.plan} placeholder="e.g. Premium, 1 profile" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="startDate" label="Start date" type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
        <SelectField
          name="durationMonths"
          label="Duration"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          options={DURATIONS.map((m) => ({ value: m, label: `${m} month${m > 1 ? "s" : ""}` }))}
        />
        <Field name="endDate" label="Ends / due on" hint="Calculated automatically">
          <p id="endDate" className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700">
            {endLabel}
          </p>
        </Field>
      </div>

      <TextField name="price" label="Selling price (XAF)" defaultValue={initial.price} inputMode="numeric" placeholder="e.g. 3000" required />

      {mode !== "edit" && (
        <div className="grid gap-4 rounded-lg border border-line bg-slate-50 p-4 sm:grid-cols-2">
          <TextField
            name="initialAmount"
            label="Amount paid now (optional)"
            inputMode="numeric"
            placeholder="0"
            hint="Records a payment dated today"
          />
          <SelectField name="initialMethod" label="Payment method" defaultValue="MTN MoMo" options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))} />
        </div>
      )}

      {mode === "edit" && (
        <SelectField
          name="status"
          label="Status"
          defaultValue={initial.status ?? "ACTIVE"}
          options={SUBSCRIPTION_STATUSES.map((s) => ({ value: s, label: SUBSCRIPTION_STATUS_LABELS[s] }))}
        />
      )}

      <TextAreaField name="notes" label="Notes (optional)" defaultValue={initial.notes} />

      <FormActions cancelHref={cancelHref} submitLabel={mode === "renew" ? "Renew subscription" : mode === "edit" ? "Save changes" : "Add subscription"} />
    </ActionForm>
  );
}
