/**
 * Changes made without a connection, replayed in order when it comes back.
 * Kept in localStorage: small, per device, and readable at startup.
 */
export type OutboxOp =
  | { kind: "toggle"; id: string; taskId: string; done: boolean; at: number }
  | {
      kind: "create";
      id: string;
      at: number;
      input: {
        title: string;
        dueDate: string | null;
        dueTime: string | null;
        priority: number;
        tags: string[];
        recurrence: string | null;
        listId: string | null;
        listName?: string;
      };
    };

export const OUTBOX_KEY = "taskly:outbox";
export const OUTBOX_EVENT = "taskly:outbox";

export function readOutbox(storage: Pick<Storage, "getItem"> | undefined = globalThis.localStorage): OutboxOp[] {
  try {
    const raw = storage?.getItem(OUTBOX_KEY);
    return raw ? (JSON.parse(raw) as OutboxOp[]) : [];
  } catch {
    return [];
  }
}

function write(ops: OutboxOp[], storage: Pick<Storage, "setItem" | "removeItem"> | undefined = globalThis.localStorage) {
  try {
    if (ops.length) storage?.setItem(OUTBOX_KEY, JSON.stringify(ops));
    else storage?.removeItem(OUTBOX_KEY);
  } catch {
    // Private mode or full storage: the change is lost, as without this feature.
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OUTBOX_EVENT));
}

/**
 * Adds a change. Toggling the same task twice offline cancels out, so the
 * outbox only ever holds the last state per task.
 */
export function enqueue(op: OutboxOp, ops: OutboxOp[] = readOutbox()): OutboxOp[] {
  let next = ops;
  if (op.kind === "toggle") {
    const pending = ops.find((o) => o.kind === "toggle" && o.taskId === op.taskId);
    next = ops.filter((o) => !(o.kind === "toggle" && o.taskId === op.taskId));
    // A task created offline is just created with the new state… or dropped from the overlay.
    if (pending && pending.kind === "toggle" && pending.done !== op.done) {
      write(next);
      return next;
    }
  }
  next = [...next, op];
  write(next);
  return next;
}

export function removeFromOutbox(id: string): OutboxOp[] {
  const next = readOutbox().filter((o) => o.id !== id);
  write(next);
  return next;
}

export function clearOutbox() {
  write([]);
}

/** A network failure (offline, captive portal), as opposed to a server error. */
export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  return error instanceof TypeError && /fetch|network|load failed/i.test(error.message);
}
