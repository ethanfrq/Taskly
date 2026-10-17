/**
 * Runs once per server start, before the first request.
 *
 * 1. A personal instance (TASKLY_ALLOWED_EMAILS) loads the secrets it
 *    generated for itself (src/lib/personal.ts).
 * 2. Local reminder scheduler: without QStash, sends due reminders every 20 s.
 *    On by default in development; on a long-running server (`next start` on
 *    a VPS) set TASKLY_INTERNAL_SCHEDULER=1. Serverless hosts use QStash.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { isPersonalInstance } = await import("./lib/auth/allowed-emails");
  if (isPersonalInstance()) {
    const [{ getDb }, { loadPersonalSecrets }] = await Promise.all([import("./db"), import("./lib/personal")]);
    const filled = await loadPersonalSecrets(getDb());
    if (filled.length) console.info(`🔐 Personal instance: ${filled.join(", ")} loaded from the database`);
  }

  const wanted =
    process.env.TASKLY_INTERNAL_SCHEDULER === "1" ||
    (process.env.NODE_ENV === "development" && !process.env.QSTASH_TOKEN);
  if (!wanted) return;

  const state = globalThis as unknown as { taskly_scheduler?: NodeJS.Timeout };
  if (state.taskly_scheduler) return;

  const { reminderDeps } = await import("./lib/reminders/runtime");
  const { fireDueReminders } = await import("./lib/reminders/service");
  let running = false;
  state.taskly_scheduler = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const counts = await fireDueReminders(reminderDeps());
      if (counts.sent || counts.deferred) console.info("⏰ reminders", counts);
    } catch (error) {
      console.error("⏰ reminder sweep failed", error);
    } finally {
      running = false;
    }
  }, 20_000);
}
