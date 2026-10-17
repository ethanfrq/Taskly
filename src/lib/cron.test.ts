import { describe, expect, it } from "vitest";
import { authorizedCron } from "./cron";

const request = (authorization?: string) =>
  new Request("http://localhost:3000/api/housekeeping", { headers: authorization ? { authorization } : {} });

describe("authorizedCron", () => {
  it("accepts the configured secret as a bearer token", () => {
    expect(authorizedCron(request("Bearer s3cret"), "s3cret")).toBe(true);
  });

  it("refuses a wrong, truncated or missing token", () => {
    expect(authorizedCron(request("Bearer other1"), "s3cret")).toBe(false);
    expect(authorizedCron(request("Bearer s3cre"), "s3cret")).toBe(false);
    expect(authorizedCron(request("s3cret"), "s3cret")).toBe(false);
    expect(authorizedCron(request(), "s3cret")).toBe(false);
  });

  it("refuses everything when no secret is configured", () => {
    expect(authorizedCron(request("Bearer "), "")).toBe(false);
    expect(authorizedCron(request("Bearer undefined"), undefined)).toBe(false);
  });
});
