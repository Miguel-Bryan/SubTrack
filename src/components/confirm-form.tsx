"use client";

import { useRef, type ReactNode } from "react";
import { SubmitButton } from "./form";

/** A button that opens a confirmation dialog before running a server action. */
export function ConfirmForm({
  action,
  trigger,
  title,
  message,
  confirmLabel = "Delete",
  pendingLabel = "Deleting...",
  tone = "danger",
  triggerClassName = "btn-danger-ghost btn-sm",
  fields,
}: {
  action: (fd: FormData) => void | Promise<void>;
  trigger: ReactNode;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  pendingLabel?: string;
  tone?: "danger" | "primary";
  triggerClassName?: string;
  fields?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => dialog.current?.showModal()}>
        {trigger}
      </button>
      <dialog
        ref={dialog}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line p-0 shadow-xl backdrop:bg-black/40"
      >
        <form action={action} className="space-y-4 p-5">
          <h2 className="text-base font-semibold text-pine-900">{title}</h2>
          <div className="text-sm text-muted">{message}</div>
          {fields}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-secondary" onClick={() => dialog.current?.close()}>
              Cancel
            </button>
            <SubmitButton variant={tone === "danger" ? "danger" : "primary"} pendingText={pendingLabel}>
              {confirmLabel}
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
