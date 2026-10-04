"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { logout } from "@/actions/auth";

const ICONS: Record<string, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  clients: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M17 14.2c2.6.3 4.5 2.2 4.5 5.3" />
    </>
  ),
  subscriptions: (
    <>
      <path d="M20 12a8 8 0 0 1-14 5.3" />
      <path d="M4 12a8 8 0 0 1 14-5.3" />
      <path d="M18 3v4h-4" />
      <path d="M6 21v-4h4" />
    </>
  ),
  payments: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  providers: (
    <>
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <path d="M7 7h.01M7 17h.01" />
    </>
  ),
  expenses: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  reports: <path d="M5 20V10M12 20V4M19 20v-7" />,
  users: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </>
  ),
};

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

const NAV = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/clients", label: "Clients", icon: "clients" },
  { href: "/subscriptions", label: "Client subscriptions", icon: "subscriptions" },
  { href: "/payments", label: "Payments", icon: "payments" },
  { href: "/providers", label: "Provider subscriptions", icon: "providers" },
  { href: "/expenses", label: "Expenses", icon: "expenses" },
  { href: "/reports", label: "Reports", icon: "reports" },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white">
      <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-sm">S</span>
      SubTrack
    </Link>
  );
}

export function Sidebar({ user }: { user: { name: string; role: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const items = user.role === "ADMIN" ? [...NAV, { href: "/users", label: "Users", icon: "users" }] : NAV;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between bg-pine-900 px-4 py-3 lg:hidden">
        <Brand />
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-1.5 text-white hover:bg-pine-800">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-pine-900 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="hidden px-5 py-5 lg:block">
          <Brand />
        </div>
        <div className="flex items-center justify-between px-5 py-4 lg:hidden">
          <span className="text-sm font-medium text-pine-300">Menu</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-1 text-pine-300 hover:bg-pine-800">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Main">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href) ? "bg-pine-700 text-white" : "text-pine-300 hover:bg-pine-800 hover:text-white"
              }`}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-pine-800 p-4">
          <p className="truncate text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-pine-300">{user.role === "ADMIN" ? "Admin" : "Collaborator"}</p>
          <form action={logout} className="mt-3">
            <button type="submit" className="w-full rounded-lg border border-pine-700 px-3 py-1.5 text-sm font-medium text-pine-100 hover:bg-pine-800">
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
