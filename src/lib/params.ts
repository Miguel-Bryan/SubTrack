export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** First value of a search param as a string ("" when missing). */
export function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}
