"use client";

import Link from "next/link";
import {
  createContext,
  useActionState,
  useContext,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/validation";

const FeedbackContext = createContext<FormState>(undefined);
export const useFormFeedback = () => useContext(FeedbackContext);

/** <form> wired to a server action: shows the top error, keeps typed values and per-field errors. */
export function ActionForm({
  action,
  children,
  className = "space-y-5",
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  return (
    <FeedbackContext.Provider value={state}>
      <form action={formAction} className={className}>
        {state?.error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {state.error}
          </div>
        )}
        {children}
      </form>
    </FeedbackContext.Provider>
  );
}

type Common = { name: string; label: string; hint?: string; className?: string };

export function Field({ name, label, hint, className, children }: Common & { children: ReactNode }) {
  const error = useFormFeedback()?.errors?.[name];
  return (
    <div className={className}>
      <label htmlFor={name} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type TextFieldProps = Common &
  Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "defaultValue"> & { defaultValue?: string | number | null };

export function TextField({ name, label, hint, className, defaultValue, ...rest }: TextFieldProps) {
  const feedback = useFormFeedback();
  const error = feedback?.errors?.[name];
  const submitted = feedback?.values?.[name];
  const controlled = rest.value !== undefined;
  return (
    <Field name={name} label={label} hint={hint} className={className}>
      <input
        key={controlled ? undefined : (submitted ?? "initial")}
        id={name}
        name={name}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...(controlled ? {} : { defaultValue: submitted ?? String(defaultValue ?? "") })}
        {...rest}
      />
    </Field>
  );
}

type SelectFieldProps = Common &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name" | "defaultValue"> & {
    defaultValue?: string | number | null;
    options: { value: string | number; label: string }[];
    placeholder?: string;
  };

export function SelectField({ name, label, hint, className, defaultValue, options, placeholder, ...rest }: SelectFieldProps) {
  const feedback = useFormFeedback();
  const error = feedback?.errors?.[name];
  const submitted = feedback?.values?.[name];
  const controlled = rest.value !== undefined;
  return (
    <Field name={name} label={label} hint={hint} className={className}>
      <select
        key={controlled ? undefined : (submitted ?? "initial")}
        id={name}
        name={name}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...(controlled ? {} : { defaultValue: submitted ?? String(defaultValue ?? "") })}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

type TextAreaProps = Common &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "defaultValue"> & { defaultValue?: string | null };

export function TextAreaField({ name, label, hint, className, defaultValue, ...rest }: TextAreaProps) {
  const feedback = useFormFeedback();
  const error = feedback?.errors?.[name];
  const submitted = feedback?.values?.[name];
  return (
    <Field name={name} label={label} hint={hint} className={className}>
      <textarea
        key={submitted ?? "initial"}
        id={name}
        name={name}
        rows={3}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        defaultValue={submitted ?? defaultValue ?? ""}
        {...rest}
      />
    </Field>
  );
}

export function CheckboxField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
      />
      {label}
    </label>
  );
}

export function SubmitButton({
  children,
  pendingText = "Saving...",
  variant = "primary",
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={variant === "danger" ? "btn-danger" : "btn-primary"}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormActions({ cancelHref, submitLabel }: { cancelHref: string; submitLabel: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <SubmitButton>{submitLabel}</SubmitButton>
      <Link href={cancelHref} className="btn-secondary">
        Cancel
      </Link>
    </div>
  );
}
