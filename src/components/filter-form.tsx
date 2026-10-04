"use client";

import type { ReactNode } from "react";

/** A GET form that re-submits when a dropdown or month picker changes (search submits on Enter). */
export function FilterForm({
  children,
  className = "flex flex-wrap items-end gap-3 border-b border-line p-4",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      method="get"
      className={className}
      onChange={(e) => {
        const t = e.target;
        if (t instanceof HTMLSelectElement || (t instanceof HTMLInputElement && t.type === "month")) {
          e.currentTarget.requestSubmit();
        }
      }}
    >
      {children}
    </form>
  );
}

export function FilterSearch({ defaultValue, placeholder }: { defaultValue: string; placeholder: string }) {
  return (
    <div className="min-w-48 flex-1">
      <label htmlFor="q" className="sr-only">
        Search
      </label>
      <input id="q" name="q" type="search" defaultValue={defaultValue} placeholder={placeholder} className="input" />
    </div>
  );
}

export function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={name} className="sr-only">
        {label}
      </label>
      <select id={name} name={name} defaultValue={value} className="input" aria-label={label}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
