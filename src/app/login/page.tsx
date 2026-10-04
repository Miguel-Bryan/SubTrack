import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_28rem]">
      <section className="hidden bg-pine-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2.5 text-lg font-bold">
          <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-sm">S</span>
          SubTrack
        </div>
        <div className="max-w-md">
          <p className="text-3xl font-bold leading-tight">Know who owes you, and what renews next.</p>
          <p className="mt-3 text-pine-300">Clients, payments, provider renewals and monthly profit, in one place.</p>
        </div>
        <p className="text-sm text-pine-300">Private tool for the two business owners.</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-pine-900">Sign in</h1>
          <p className="mt-1 mb-6 text-sm text-muted">Use the account your admin created for you.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
