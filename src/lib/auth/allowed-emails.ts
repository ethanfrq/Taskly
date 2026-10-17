/** TASKLY_ALLOWED_EMAILS: comma-separated addresses allowed to sign in. Unset: anyone. */
export function allowedEmailsFromEnv(value = process.env.TASKLY_ALLOWED_EMAILS): string[] {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** A personal instance: locked to a list of addresses (docs/self-hosting.md). */
export function isPersonalInstance(env: Record<string, string | undefined> = process.env): boolean {
  return allowedEmailsFromEnv(env.TASKLY_ALLOWED_EMAILS).length > 0;
}
