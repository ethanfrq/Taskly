import { beforeEach, describe, expect, it } from "vitest";
import { OUTBOX_KEY, type OutboxOp, enqueue, readOutbox } from "./outbox";

const memory = new Map<string, string>();
const storage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
};
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });

const toggle = (taskId: string, done: boolean, id = crypto.randomUUID()): OutboxOp => ({ kind: "toggle", id, taskId, done, at: Date.now() });

beforeEach(() => memory.clear());

describe("outbox", () => {
  it("keeps changes in order", () => {
    enqueue(toggle("a", true));
    enqueue({ kind: "create", id: "c1", at: 1, input: { title: "Milk", dueDate: null, dueTime: null, priority: 0, tags: [], recurrence: null, listId: null } });
    expect(readOutbox().map((o) => o.kind)).toEqual(["toggle", "create"]);
    expect(memory.has(OUTBOX_KEY)).toBe(true);
  });

  it("cancels a check followed by an uncheck of the same task", () => {
    enqueue(toggle("a", true));
    enqueue(toggle("a", false));
    expect(readOutbox()).toEqual([]);
    expect(memory.has(OUTBOX_KEY)).toBe(false);
  });

  it("survives corrupted storage", () => {
    memory.set(OUTBOX_KEY, "{not json");
    expect(readOutbox()).toEqual([]);
  });
});
