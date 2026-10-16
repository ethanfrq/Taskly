"use client";

import { IconCloudOff, IconRefresh } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createTaskAction, toggleTaskAction } from "@/app/(app)/actions";
import { useI18n } from "@/i18n/client";
import { plural } from "@/i18n/format";
import { OUTBOX_EVENT, type OutboxOp, isNetworkError, readOutbox, removeFromOutbox } from "@/lib/offline/outbox";

const subscribeOnline = (notify: () => void) => {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
};
const subscribeOutbox = (notify: () => void) => {
  window.addEventListener(OUTBOX_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(OUTBOX_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
};

let cachedRaw = "";
let cachedOps: OutboxOp[] = [];
/** Stable snapshot for useSyncExternalStore: same array until the outbox changes. */
function outboxSnapshot(): OutboxOp[] {
  const raw = JSON.stringify(readOutbox());
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedOps = JSON.parse(raw) as OutboxOp[];
  }
  return cachedOps;
}
const EMPTY: OutboxOp[] = [];

export function useOutbox() {
  return useSyncExternalStore(subscribeOutbox, outboxSnapshot, () => EMPTY);
}

async function replay(op: OutboxOp) {
  if (op.kind === "toggle") await toggleTaskAction(op.taskId, op.done);
  else await createTaskAction(op.input);
}

/**
 * Shows the offline state and sends queued changes once the network is back.
 * A change the server refuses (task deleted meanwhile) is dropped.
 */
export function OfflineSync() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const ops = useOutbox();
  const [syncing, setSyncing] = useState(false);
  const running = useRef(false);

  const flush = useCallback(async () => {
    if (running.current || !navigator.onLine || readOutbox().length === 0) return;
    running.current = true;
    setSyncing(true);
    try {
      for (const op of readOutbox()) {
        try {
          await replay(op);
          removeFromOutbox(op.id);
        } catch (error) {
          if (isNetworkError(error)) break;
          removeFromOutbox(op.id);
        }
      }
      router.refresh();
    } finally {
      running.current = false;
      setSyncing(false);
    }
  }, [router]);

  // Retry when the network comes back, when the app returns to the foreground,
  // and every 15 s while changes wait ("online" can be true without a working network).
  const pending = ops.length > 0;
  useEffect(() => {
    if (!pending) return;
    const run = () => void flush();
    run();
    window.addEventListener("online", run);
    document.addEventListener("visibilitychange", run);
    const timer = setInterval(run, 15_000);
    return () => {
      window.removeEventListener("online", run);
      document.removeEventListener("visibilitychange", run);
      clearInterval(timer);
    };
  }, [pending, flush]);

  if (online && ops.length === 0) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-30 flex items-center gap-2 bg-[#3A3A3C] px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 text-[13px] text-white"
    >
      {online ? <IconRefresh size={16} className={syncing ? "animate-spin" : ""} aria-hidden /> : <IconCloudOff size={16} aria-hidden />}
      <span className="flex-1">{!online ? t.offline.banner : syncing ? t.offline.syncing : ""}</span>
      {ops.length > 0 ? <span>{plural(locale, ops.length, t.offline.pending)}</span> : null}
    </div>
  );
}
