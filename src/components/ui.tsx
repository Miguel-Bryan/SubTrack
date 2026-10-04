import Link from "next/link";
import type { ReactNode } from "react";
import type { Lifecycle, PaymentState, ProviderState } from "@/lib/status";

const TONES = {
  green: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-900 ring-amber-600/30",
  red: "bg-red-50 text-red-800 ring-red-600/25",
  blue: "bg-sky-50 text-sky-800 ring-sky-600/20",
  slate: "bg-slate-100 text-slate-700 ring-slate-500/20",
} as const;
export type Tone = keyof typeof TONES;

const KINDS: Record<PaymentState | Lifecycle | ProviderState, [Tone, string]> = {
  paid: ["green", "Paid"],
  partial: ["blue", "Partly paid"],
  unpaid: ["slate", "Unpaid"],
  due_soon: ["amber", "Due soon"],
  overdue: ["red", "Overdue"],
  active: ["green", "Active"],
  expiring: ["amber", "Expiring soon"],
  expired: ["red", "Expired"],
  renewed: ["slate", "Renewed"],
  ended: ["slate", "Ended"],
  cancelled: ["slate", "Cancelled"],
};

export function StatusBadge({ kind }: { kind: keyof typeof KINDS }) {
  const [tone, label] = KINDS[kind];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${TONES[tone]}`}>
      {label}
    </span>
  );
}

/** Subtle row tint so overdue / due-soon rows stand out in tables. */
export function rowTone(state: PaymentState | ProviderState | Lifecycle): string {
  if (state === "overdue" || state === "expired") return "bg-red-50/60";
  if (state === "due_soon" || state === "expiring") return "bg-amber-50/60";
  return "";
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-pine-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-pine-900">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="font-semibold text-pine-900">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "red" | "green" }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd
        className={`mt-0.5 text-lg font-semibold tabular-nums ${
          tone === "red" ? "text-red-700" : tone === "green" ? "text-emerald-700" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-brand-700 hover:underline">
      {children}
    </Link>
  );
}
