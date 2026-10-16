import { and, asc, eq, gte, lt } from "drizzle-orm";
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

/** Adds or updates events; an event resent with the same externalId is updated, not duplicated. */
export async function upsertEvents(db: Database, userId: string, inputs: EventInput[]): Promise<number> {
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
    if (input.externalId) {
      await db
        .insert(events)
        .values({ id: crypto.randomUUID(), userId, externalId: input.externalId, ...values })
        .onConflictDoUpdate({ target: [events.userId, events.externalId], set: values });
    } else {
      await db.insert(events).values({ id: crypto.randomUUID(), userId, externalId: null, ...values });
    }
  }
  return inputs.length;
}

/** Events starting in [from, to). */
export async function getEventsBetween(db: Database, userId: string, from: Date, to: Date): Promise<CalendarEvent[]> {
  return db
    .select()
    .from(events)
    .where(and(eq(events.userId, userId), gte(events.startsAt, from), lt(events.startsAt, to)))
    .orderBy(asc(events.startsAt));
}

export async function deleteEvent(db: Database, userId: string, id: string): Promise<void> {
  await db.delete(events).where(and(eq(events.id, id), eq(events.userId, userId)));
}
