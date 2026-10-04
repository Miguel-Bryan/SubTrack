/** 20000 -> "20 000 XAF" (non-breaking spaces so amounts never wrap). */
export function formatXAF(n: number): string {
  const sign = n < 0 ? "-" : "";
  const grouped = String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  return `${sign}${grouped}\u00a0XAF`;
}

/** Builds a wa.me link. Local Cameroon numbers (9 digits) get the 237 prefix. */
export function whatsappLink(phone: string, message?: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 9) digits = `237${digits}`;
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
