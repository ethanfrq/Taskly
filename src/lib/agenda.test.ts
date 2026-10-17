import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "@/db/schema";
import type { TaskView } from "@/lib/tasks/service";
import { buildAgenda } from "./agenda";

const PARIS = "Europe/Paris";

const event = (title: string, startsAt: string, allDay = false) =>
  ({ id: title, title, startsAt: new Date(startsAt), allDay, location: null }) as CalendarEvent;
const task = (title: string, dueDate: string, dueTime: string | null = null) => ({ id: title, title, dueDate, dueTime }) as TaskView;

const titles = (agenda: ReturnType<typeof buildAgenda>) =>
  agenda.map(([day, items]) => [day, items.map((i) => (i.kind === "event" ? i.title : i.task.title))]);

describe("buildAgenda", () => {
  it("interleaves events and timed tasks, untimed tasks last in their order", () => {
    const agenda = buildAgenda(
      [event("Team sync", "2026-10-17T15:00:00Z"), event("Demo", "2026-10-17T12:00:00Z"), event("Holiday", "2026-10-19T00:00:00+02:00", true)],
      [task("Slides", "2026-10-17"), task("Send quote", "2026-10-17", "10:30"), task("Agenda", "2026-10-17", "14:00"), task("Read PR", "2026-10-17"), task("Standup", "2026-10-19", "09:30")],
      PARIS,
      "2026-10-17",
    );
    expect(titles(agenda)).toEqual([
      ["2026-10-17", ["Send quote", "Demo", "Agenda", "Team sync", "Slides", "Read PR"]],
      ["2026-10-19", ["Holiday", "Standup"]],
    ]);
  });

  it("files events by the user's local day and puts them before a task at the same minute", () => {
    const agenda = buildAgenda([event("Late call", "2026-10-17T21:30:00Z")], [task("Call prep", "2026-10-17", "23:30")], PARIS, "2026-10-17");
    expect(titles(agenda)).toEqual([["2026-10-17", ["Late call", "Call prep"]]]);
  });
});
