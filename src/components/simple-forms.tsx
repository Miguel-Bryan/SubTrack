import { BILLING_PERIODS, EXPENSE_CATEGORIES, ROLES, ROLE_LABELS } from "@/lib/constants";
import type { FormState } from "@/lib/validation";
import { ActionForm, CheckboxField, FormActions, SelectField, TextAreaField, TextField } from "./form";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function ClientForm({
  action,
  cancelHref,
  submitLabel,
  client,
}: {
  action: Action;
  cancelHref: string;
  submitLabel: string;
  client?: { fullName: string; phone: string; accountUsername: string; notes: string | null };
}) {
  return (
    <ActionForm action={action}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="fullName" label="Full name" defaultValue={client?.fullName} required />
        <TextField name="phone" label="Phone number" type="tel" defaultValue={client?.phone} placeholder="e.g. 6 77 12 34 56" hint="Used for the WhatsApp reminder link" required />
      </div>
      <TextField
        name="accountUsername"
        label="Subscription account username"
        defaultValue={client?.accountUsername}
        hint="The username or profile name this client uses on the platform"
        required
      />
      <TextAreaField name="notes" label="Notes (optional)" defaultValue={client?.notes} />
      <FormActions cancelHref={cancelHref} submitLabel={submitLabel} />
    </ActionForm>
  );
}

export function ExpenseForm({
  action,
  cancelHref,
  submitLabel,
  todayValue,
  expense,
}: {
  action: Action;
  cancelHref: string;
  submitLabel: string;
  todayValue: string;
  expense?: { name: string; amount: number; spentAt: string; category: string; notes: string | null };
}) {
  return (
    <ActionForm action={action}>
      <TextField name="name" label="Expense name" defaultValue={expense?.name} placeholder="e.g. Facebook ads" required />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="amount" label="Amount (XAF)" inputMode="numeric" defaultValue={expense?.amount} required />
        <TextField name="spentAt" label="Date" type="date" defaultValue={expense?.spentAt ?? todayValue} required />
        <SelectField
          name="category"
          label="Category"
          defaultValue={expense?.category ?? EXPENSE_CATEGORIES[0]}
          options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
      </div>
      <TextAreaField name="notes" label="Notes (optional)" defaultValue={expense?.notes} />
      <FormActions cancelHref={cancelHref} submitLabel={submitLabel} />
    </ActionForm>
  );
}

export function ProviderForm({
  action,
  cancelHref,
  submitLabel,
  todayValue,
  provider,
  platforms,
}: {
  action: Action;
  cancelHref: string;
  submitLabel: string;
  todayValue: string;
  platforms: string[];
  provider?: {
    platform: string;
    accountIdentifier: string | null;
    purchaseDate: string;
    renewalDate: string;
    cost: number;
    billingMonths: number;
    capacity: number;
    occupiedSeats: number;
    status: string;
    notes: string | null;
  };
}) {
  return (
    <ActionForm action={action}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <TextField name="platform" label="Platform / provider" defaultValue={provider?.platform} list="provider-platforms" placeholder="e.g. Netflix" required />
          <datalist id="provider-platforms">
            {platforms.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
        <TextField name="accountIdentifier" label="Account identifier (optional)" defaultValue={provider?.accountIdentifier} placeholder="e.g. email or account nickname" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="purchaseDate" label="Purchase date" type="date" defaultValue={provider?.purchaseDate ?? todayValue} required />
        <TextField name="renewalDate" label="Renewal date" type="date" defaultValue={provider?.renewalDate} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="cost" label="Cost per billing period (XAF)" inputMode="numeric" defaultValue={provider?.cost} required />
        <SelectField
          name="billingMonths"
          label="Billing period"
          defaultValue={provider?.billingMonths ?? 1}
          options={BILLING_PERIODS.map((b) => ({ value: b.months, label: b.label }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="capacity" label="Capacity (seats)" inputMode="numeric" defaultValue={provider?.capacity ?? 1} required />
        <TextField name="occupiedSeats" label="Occupied seats" inputMode="numeric" defaultValue={provider?.occupiedSeats ?? 0} />
        <SelectField
          name="status"
          label="Status"
          defaultValue={provider?.status ?? "ACTIVE"}
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "CANCELLED", label: "Cancelled (we stopped paying)" },
          ]}
        />
      </div>

      <TextAreaField name="notes" label="Notes (optional)" defaultValue={provider?.notes} />

      {!provider && <CheckboxField name="recordExpense" label="Also record the cost as an expense" defaultChecked />}

      <FormActions cancelHref={cancelHref} submitLabel={submitLabel} />
    </ActionForm>
  );
}

export function UserForm({
  action,
  cancelHref,
  submitLabel,
  user,
}: {
  action: Action;
  cancelHref: string;
  submitLabel: string;
  user?: { name: string; username: string; role: string };
}) {
  return (
    <ActionForm action={action}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="name" label="Name" defaultValue={user?.name} required />
        <TextField name="username" label="Email or username" defaultValue={user?.username} autoComplete="off" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          name="role"
          label="Role"
          defaultValue={user?.role ?? "COLLABORATOR"}
          options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
        />
        <TextField
          name="password"
          label={user ? "New password (leave empty to keep the current one)" : "Password"}
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
          required={!user}
        />
      </div>
      <FormActions cancelHref={cancelHref} submitLabel={submitLabel} />
    </ActionForm>
  );
}
