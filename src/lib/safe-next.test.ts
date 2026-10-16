import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("keeps same-site paths", () => {
    expect(safeNext("/today?list=work")).toBe("/today?list=work");
  });

  it("rejects external and protocol-relative targets", () => {
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
  });

  it("falls back when missing", () => {
    expect(safeNext(undefined, "/today")).toBe("/today");
    expect(safeNext(["/a", "/b"])).toBe("/a");
  });
});
