/**
 * Validates a post-sign-in redirect target: only same-site absolute paths,
 * never "//evil.com" or "https://…" (open redirect).
 */
export function safeNext(value: string | string[] | undefined, fallback = "/"): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
