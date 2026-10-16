import { describe, expect, it } from "vitest";
import { isRecurrence, nextOccurrence } from "./recurrence";

describe("nextOccurrence", () => {
  it("handles daily and weekdays", () => {
    expect(nextOccurrence("daily", "2026-10-16")).toBe("2026-10-17");
    // Friday → Monday
    expect(nextOccurrence("weekdays", "2026-10-16")).toBe("2026-10-19");
  });

  it("handles weekly rules", () => {
    expect(nextOccurrence("weekly", "2026-10-16")).toBe("2026-10-23");
    expect(nextOccurrence("weekly:1,3", "2026-10-16")).toBe("2026-10-19");
    expect(nextOccurrence("weekly:1,3", "2026-10-16", "2026-10-19")).toBe("2026-10-21");
  });

  it("clamps monthly rules to the end of short months", () => {
    expect(nextOccurrence("monthly", "2026-01-31")).toBe("2026-02-28");
    expect(nextOccurrence("monthly", "2026-01-31", "2026-02-28")).toBe("2026-03-31");
  });

  it("catches up from a late completion", () => {
    expect(nextOccurrence("daily", "2026-10-01", "2026-10-16")).toBe("2026-10-17");
  });

  it("validates rules", () => {
    expect(isRecurrence("weekly:1,5")).toBe(true);
    expect(isRecurrence("weekly:8")).toBe(false);
    expect(isRecurrence("yearly")).toBe(false);
  });
});
