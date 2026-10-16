import "server-only";

export type Email = { to: string; subject: string; text: string };

/**
 * Sends an email through Resend when RESEND_API_KEY is set.
 * Without it (local development), the email is printed to the server console.
 */
export async function sendEmail(email: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
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
