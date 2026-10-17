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

/**
 * Without an email provider, sign-in codes are printed in the server logs:
 * in development, and on a personal instance (a public one refuses to run).
 */
export function signInCodesInLogs(env: Record<string, string | undefined> = process.env): boolean {
  return !env.RESEND_API_KEY;
}
