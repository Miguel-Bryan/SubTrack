import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-xl font-semibold">We couldn't find that page</h1>
      <p className="mt-2 text-sm text-muted">The record may have been deleted, or the link is wrong.</p>
      <Link href="/" className="btn-primary mt-6">Back to dashboard</Link>
    </div>
  );
}
