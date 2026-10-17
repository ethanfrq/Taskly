import { afterEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "./email";

vi.mock("server-only", () => ({}));

const email = { to: "sam@example.com", subject: "Your code", text: "123456" };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("sendEmail without RESEND_API_KEY", () => {
  it("prints the email in development", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await sendEmail(email);
    expect(log.mock.calls[0][0]).toContain("123456");
  });

  it("prints it on a personal instance, whose owner alone can ask for a code", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TASKLY_ALLOWED_EMAILS", "sam@example.com");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await sendEmail(email);
    expect(log.mock.calls[0][0]).toContain("123456");
  });

  it("refuses in production instead of writing the code to the logs", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TASKLY_ALLOWED_EMAILS", "");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await expect(sendEmail(email)).rejects.toThrow(/RESEND_API_KEY is missing/);
    expect(log).not.toHaveBeenCalled();
  });
});
