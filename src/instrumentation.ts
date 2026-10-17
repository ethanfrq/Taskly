/**
 * Runs once per server start, before the first request.
 *
 * 1. A personal instance (TASKLY_ALLOWED_EMAILS) loads the secrets it
 *    generated for itself (src/lib/personal.ts).
 * 2. Local reminder scheduler: without QStash, sends due reminders every 20 s.
 *    On by default in development; on a long-running server (`next start` on
 *    a VPS) set TASKLY_INTERNAL_SCHEDULER=1. Serverless hosts use QStash.
 * 3. Housekeeping: deletes expired bookkeeping rows once a day
 *    (src/lib/housekeeping.ts), under the same switch. Serverless hosts call
 *    GET /api/housekeeping from a cron instead (vercel.json).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { isPersonalInstance } = await import("./lib/auth/allowed-emails");
  if (isPersonalInstance()) {
    const [{ getDb }, { loadPersonalSecrets }] = await Promise.all([import("./db"), import("./lib/personal")]);
    const filled = await loadPersonalSecrets(getDb());
    if (filled.length) console.info(`🔐 Personal instance: ${filled.join(", ")} loaded from the database`);
  }

  const internal = process.env.TASKLY_INTERNAL_SCHEDULER === "1";
  const development = process.env.NODE_ENV === "development";
  if (internal || (development && !process.env.QSTASH_TOKEN)) await startReminderSweep();
  if (internal || development) await startHousekeeping();
}

const state = globalThis as unknown as { taskly_scheduler?: NodeJS.Timeout; taskly_housekeeping?: NodeJS.Timeout };

async function startReminderSweep() {
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

async function startHousekeeping() {
  if (state.taskly_housekeeping) return;
  const [{ getDb }, { cleanupDatabase }] = await Promise.all([import("./db"), import("./lib/housekeeping")]);
  const run = async () => {
    try {
      const counts = await cleanupDatabase(getDb());
      if (Object.values(counts).some(Boolean)) console.info("🧹 housekeeping", counts);
    } catch (error) {
      console.error("🧹 housekeeping failed", error);
    }
  };
  // Once at start, then daily: a process restarted every day still gets its cleanup.
  state.taskly_housekeeping = setInterval(run, 24 * 60 * 60 * 1000);
  void run();
}
