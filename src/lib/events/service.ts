import { and, asc, eq, gte, inArray, lt, notInArray, or } from "drizzle-orm";
import type { Database } from "@/db";
import { type CalendarEvent, events } from "@/db/schema";
import type { SourceKind } from "@/lib/tasks/sources";

export type EventInput = {
  title: string;
  startsAt: Date;
  endsAt?: Date | null;
  allDay?: boolean;
  location?: string | null;
  sourceKind?: SourceKind | null;
  sourceUrl?: string | null;
  externalId?: string | null;
};

/**
 * Adds or updates events; an event resent with the same externalId is updated,
 * not duplicated. Returns the ids of the rows it wrote.
 */
export async function upsertEvents(db: Database, userId: string, inputs: EventInput[]): Promise<string[]> {
  const ids: string[] = [];
  for (const input of inputs) {
    const values = {
      title: input.title.trim(),
      startsAt: input.startsAt,
      endsAt: input.endsAt ?? null,
      allDay: input.allDay ?? false,
      location: input.location ?? null,
      sourceKind: input.sourceKind ?? "calendar",
      sourceUrl: input.sourceUrl ?? null,
    };
    const [row] = input.externalId
      ? await db
          .insert(events)
          .values({ id: crypto.randomUUID(), userId, externalId: input.externalId, ...values })
          .onConflictDoUpdate({ target: [events.userId, events.externalId], set: values })
          .returning({ id: events.id })
      : await db
          .insert(events)
          .values({ id: crypto.randomUUID(), userId, externalId: null, ...values })
          .returning({ id: events.id });
    ids.push(row.id);
  }
  return ids;
}

/**
 * Removes the events starting in [from, to) except `keep`: Claude sent the
 * whole day, so anything else was cancelled or moved in the calendar.
 */
export async function pruneEvents(db: Database, userId: string, from: Date, to: Date, keep: string[]): Promise<number> {
  const conditions = [eq(events.userId, userId), gte(events.startsAt, from), lt(events.startsAt, to)];
  if (keep.length) conditions.push(notInArray(events.id, keep));
  const removed = await db.delete(events).where(and(...conditions)).returning({ id: events.id });
  return removed.length;
}

/** Removes events by the id Claude knows them by: the calendar's id, or Taskly's when it had none. */
export async function removeEvents(db: Database, userId: string, ids: string[]): Promise<number> {
  if (!ids.length) return 0;
  const removed = await db
    .delete(events)
    .where(and(eq(events.userId, userId), or(inArray(events.externalId, ids), inArray(events.id, ids))))
    .returning({ id: events.id });
  return removed.length;
}

/** Events starting in [from, to). */
export async function getEventsBetween(db: Database, userId: string, from: Date, to: Date): Promise<CalendarEvent[]> {
  return db
    .select()
    .from(events)
    .where(and(eq(events.userId, userId), gte(events.startsAt, from), lt(events.startsAt, to)))
    .orderBy(asc(events.startsAt));
}
