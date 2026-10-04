import { z } from "zod";
import {
  BILLING_PERIODS,
  DURATIONS,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  ROLES,
  SUBSCRIPTION_STATUSES,
} from "./constants";
import { parseDateInput } from "./dates";

/** Returned by form actions so the form can show errors and keep what was typed. */
export type FormState =
  | { error?: string; errors?: Record<string, string>; values?: Record<string, string> }
  | undefined;

function formValues(fd: FormData) {
  const values: Record<string, string> = {};
  fd.forEach((v, k) => {
    if (typeof v === "string") values[k] = v;
  });
  return values;
}

export function validate<S extends z.ZodType>(
  schema: S,
  fd: FormData,
): { ok: true; data: z.infer<S>; values: Record<string, string> } | { ok: false; state: NonNullable<FormState> } {
  const values = formValues(fd);
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data, values };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, state: { errors, values, error: "Please fix the highlighted fields." } };
}

/** Field-level error produced by business rules (after the schema passed). */
export function fail(values: Record<string, string>, errors: Record<string, string>): NonNullable<FormState> {
  return { errors, values, error: "Please fix the highlighted fields." };
}

// ---------- field helpers ----------
const text = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long (max ${max} characters)`);

const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Too long (max ${max} characters)`)
    .optional()
    .transform((v) => (v ? v : null));

const int = (label: string, opts: { min?: number; max?: number; optional?: boolean } = {}) => {
  const { min = 0, max = 1_000_000_000, optional = false } = opts;
  return z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      const cleaned = (v ?? "").replace(/[\s,\u00a0]/g, "");
      if (!cleaned) {
        if (optional) return 0;
        ctx.addIssue({ code: "custom", message: `${label} is required` });
        return z.NEVER;
      }
      if (!/^\d+$/.test(cleaned)) {
        ctx.addIssue({ code: "custom", message: `${label} must be a whole number` });
        return z.NEVER;
      }
      const n = Number(cleaned);
      if (n < min || n > max) {
        ctx.addIssue({ code: "custom", message: `${label} must be between ${min} and ${max}` });
        return z.NEVER;
      }
      return n;
    });
};

const date = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      const d = parseDateInput(v ?? "");
      if (!d) {
        ctx.addIssue({ code: "custom", message: `${label} must be a valid date` });
        return z.NEVER;
      }
      return d;
    });

const oneOf = <T extends readonly (string | number)[]>(label: string, list: T) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      const match = list.find((item) => String(item) === v);
      if (match === undefined) {
        ctx.addIssue({ code: "custom", message: `Choose a valid ${label}` });
        return z.NEVER;
      }
      return match as T[number];
    });

// ---------- schemas ----------
export const clientSchema = z.object({
  fullName: text("Full name", 100),
  phone: text("Phone number", 30).refine((v) => /^[0-9+()\s.-]{6,}$/.test(v), "Enter a valid phone number"),
  accountUsername: text("Account username", 80),
  notes: optionalText(),
});

export const subscriptionSchema = z.object({
  clientId: text("Client", 60),
  platform: text("Platform", 60),
  plan: text("Plan", 80),
  startDate: date("Start date"),
  durationMonths: oneOf("duration", DURATIONS),
  price: int("Selling price", { min: 1 }),
  notes: optionalText(),
  // only used when creating / renewing
  initialAmount: int("Amount paid", { optional: true }),
  initialMethod: z.string().optional(),
  renewFromId: z.string().optional(),
  // only used when editing
  status: oneOf("status", SUBSCRIPTION_STATUSES).optional(),
});

export const paymentSchema = z.object({
  subscriptionId: text("Subscription", 60),
  amount: int("Amount", { min: 1 }),
  paidAt: date("Payment date"),
  method: oneOf("payment method", PAYMENT_METHODS),
  reference: optionalText(80),
  notes: optionalText(),
});

export const providerSchema = z.object({
  platform: text("Platform", 60),
  accountIdentifier: optionalText(120),
  purchaseDate: date("Purchase date"),
  renewalDate: date("Renewal date"),
  cost: int("Cost"),
  billingMonths: oneOf("billing period", BILLING_PERIODS.map((b) => b.months)),
  capacity: int("Capacity", { min: 1, max: 1000 }),
  occupiedSeats: int("Occupied seats", { optional: true, max: 1000 }),
  status: oneOf("status", ["ACTIVE", "CANCELLED"] as const),
  notes: optionalText(),
  recordExpense: z.string().optional(),
});

export const expenseSchema = z.object({
  name: text("Expense name", 100),
  amount: int("Amount", { min: 1 }),
  spentAt: date("Date"),
  category: oneOf("category", EXPENSE_CATEGORIES),
  notes: optionalText(),
});

const username = z
  .string()
  .trim()
  .min(3, "Use at least 3 characters")
  .max(60, "Too long")
  .refine((v) => /^[A-Za-z0-9_.@+-]+$/.test(v), "Use letters, numbers and . _ @ + - only")
  .transform((v) => v.toLowerCase()); // usernames are case-insensitive

export const userCreateSchema = z.object({
  name: text("Name", 80),
  username,
  role: oneOf("role", ROLES),
  password: z.string().min(8, "Use at least 8 characters").max(100, "Too long"),
});

export const userUpdateSchema = z.object({
  name: text("Name", 80),
  username,
  role: oneOf("role", ROLES),
  password: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v) return undefined;
      if (v.length < 8) {
        ctx.addIssue({ code: "custom", message: "Use at least 8 characters" });
        return z.NEVER;
      }
      return v;
    }),
});

export const loginSchema = z.object({
  username: text("Username", 60),
  password: z.string().min(1, "Password is required"),
});
