"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function FlashMessage() {
  const params = useSearchParams();
  const pathname = usePathname();
  const ok = params.get("ok");
  const err = params.get("err");
  const message = ok ?? err;
  const [hidden, setHidden] = useState<string | null>(null);

  function dismiss() {
    setHidden(message);
    const next = new URLSearchParams(params.toString());
    next.delete("ok");
    next.delete("err");
    const query = next.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  useEffect(() => {
    if (!message) return;
    setHidden(null);
    const timer = setTimeout(dismiss, 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  if (!message || hidden === message) return null;
  const isError = !ok;
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`fixed top-4 right-4 left-4 z-[60] flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg sm:left-auto sm:max-w-sm ${
        isError ? "border-red-200 bg-red-50 text-red-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
      }`}
    >
      <span>{message}</span>
      <button type="button" onClick={dismiss} aria-label="Dismiss message" className="-mt-0.5 text-lg leading-none opacity-60 hover:opacity-100">
        ×
      </button>
    </div>
  );
}

export function Flash() {
  return (
    <Suspense>
      <FlashMessage />
    </Suspense>
  );
}
