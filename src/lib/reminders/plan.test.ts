import { describe, expect, it } from "vitest";
import { MAX_FOLLOW_UPS, afterQuietHours, followUpCount, inQuietHours, nextDailyAt, taskReminderAt } from "./plan";

const PARIS = "Europe/Paris";

describe("followUpCount (D-007)", () => {
  it("follows the insistence level", () => {
    expect(followUpCount(1, 3, false)).toBe(0);
    expect(followUpCount(2, 0, false)).toBe(1);
    expect(followUpCount(3, 0, false)).toBe(2);
    expect(followUpCount(4, 0, false)).toBe(MAX_FOLLOW_UPS);
  });

  it("skips follow-ups for non-priority tasks when asked", () => {
    expect(followUpCount(4, 0, true)).toBe(0);
    expect(followUpCount(4, 1, true)).toBe(MAX_FOLLOW_UPS);
  });
});

describe("taskReminderAt", () => {
  it("needs a day and a time", () => {
    expect(taskReminderAt("2026-10-16", null, PARIS)).toBeNull();
    expect(taskReminderAt("2026-10-16", "14:00", PARIS)?.toISOString()).toBe("2026-10-16T12:00:00.000Z");
  });
});

describe("quiet hours", () => {
  it("handles windows across midnight", () => {
    expect(inQuietHours("23:10", "21:00", "07:00")).toBe(true);
    expect(inQuietHours("06:59", "21:00", "07:00")).toBe(true);
    expect(inQuietHours("07:00", "21:00", "07:00")).toBe(false);
    expect(inQuietHours("13:00", "12:00", "14:00")).toBe(true);
    expect(inQuietHours("13:00", "08:00", "08:00")).toBe(false);
  });

  it("moves a late reminder to the next morning", () => {
    const at = new Date("2026-10-16T21:10:00Z"); // 23:10 in Paris
    expect(afterQuietHours(at, PARIS, "21:00", "07:00").toISOString()).toBe("2026-10-17T05:00:00.000Z");
  });

  it("moves an early reminder to the same morning", () => {
    const at = new Date("2026-10-17T03:30:00Z"); // 05:30 in Paris
    expect(afterQuietHours(at, PARIS, "21:00", "07:00").toISOString()).toBe("2026-10-17T05:00:00.000Z");
  });

  it("leaves daytime reminders alone", () => {
    const at = new Date("2026-10-16T12:00:00Z");
    expect(afterQuietHours(at, PARIS, "21:00", "07:00")).toEqual(at);
  });
});

describe("nextDailyAt", () => {
  it("gives today's time if still ahead, else tomorrow's", () => {
    const morning = new Date("2026-10-16T04:00:00Z"); // 06:00 Paris
    expect(nextDailyAt("07:30", PARIS, morning).toISOString()).toBe("2026-10-16T05:30:00.000Z");
    const noon = new Date("2026-10-16T10:00:00Z");
    expect(nextDailyAt("07:30", PARIS, noon).toISOString()).toBe("2026-10-17T05:30:00.000Z");
  });
});
