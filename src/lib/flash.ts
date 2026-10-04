import { redirect } from "next/navigation";

/** Redirect to `path` and show a success ("ok") or error ("err") message there. */
export function go(path: string, kind: "ok" | "err", message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${kind}=${encodeURIComponent(message)}`);
}

/** Only allow same-site relative paths when redirecting to a user-supplied location. */
export function safePath(path: string | undefined, fallback: string): string {
  return path && path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}
