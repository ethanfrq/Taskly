import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  isValidDay,
  isValidTime,
  startOfDayUtc,
  timeIn,
  todayIn,
  weekdayOf,
  zonedToUtc,
} from "./time";

describe("todayIn / timeIn", () => {
  const instant = new Date("2026-10-16T22:30:00Z");

  it("uses the user's time zone, not the server's", () => {
    expect(todayIn("Europe/Paris", instant)).toBe("2026-10-17");
    expect(todayIn("America/New_York", instant)).toBe("2026-10-16");
    expect(timeIn("Europe/Paris", instant)).toBe("00:30");
  });
});

describe("day arithmetic", () => {
  it("adds days across months and years", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("knows weekdays and distances", () => {
    expect(weekdayOf("2026-10-16")).toBe(5);
    expect(daysBetween("2026-10-16", "2026-10-19")).toBe(3);
    expect(daysBetween("2026-10-16", "2026-10-15")).toBe(-1);
  });

  it("validates days and times", () => {
    expect(isValidDay("2026-02-29")).toBe(false);
    expect(isValidDay("2028-02-29")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
    expect(isValidTime("24:00")).toBe(false);
  });
});

describe("zonedToUtc", () => {
  it("handles summer and winter time in Paris", () => {
    expect(zonedToUtc("2026-07-01", "09:00", "Europe/Paris").toISOString()).toBe("2026-07-01T07:00:00.000Z");
    expect(zonedToUtc("2026-12-01", "09:00", "Europe/Paris").toISOString()).toBe("2026-12-01T08:00:00.000Z");
  });

  it("handles the day clocks change", () => {
    expect(zonedToUtc("2026-03-29", "09:00", "Europe/Paris").toISOString()).toBe("2026-03-29T07:00:00.000Z");
    expect(zonedToUtc("2026-10-25", "09:00", "Europe/Paris").toISOString()).toBe("2026-10-25T08:00:00.000Z");
  });

  it("gives the start of a local day", () => {
    expect(startOfDayUtc("2026-10-17", "Asia/Tokyo").toISOString()).toBe("2026-10-16T15:00:00.000Z");
  });
});
