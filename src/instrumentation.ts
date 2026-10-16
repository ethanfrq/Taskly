/**
 * Local reminder scheduler: without QStash, sends due reminders every 20 s.
 * On by default in development; on a long-running server (`next start` on a
 * VPS) set TASKLY_INTERNAL_SCHEDULER=1. Serverless hosts use QStash or a cron.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
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
