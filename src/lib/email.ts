import "server-only";

export type Email = { to: string; subject: string; text: string };

/**
 * Sends an email through Resend when RESEND_API_KEY is set.
 * Without it, in development, the email is printed to the server console.
 * Production refuses: sign-in codes don't belong in logs, and users would
 * wait for an email that never comes.
 */
export async function sendEmail(email: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production" && !process.env.TASKLY_ALLOW_DEV_SECRET) {
      throw new Error("RESEND_API_KEY is missing: Taskly can't send sign-in codes (docs/self-hosting.md).");
    }
    console.info(`\n📧 Email to ${email.to}\n   ${email.subject}\n\n${email.text}\n`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Taskly <onboarding@resend.dev>",
      to: email.to,
      subject: email.subject,
      text: email.text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Email not sent (${response.status}): ${await response.text()}`);
  }
}
