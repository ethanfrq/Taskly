import { requireMcpAuth } from "@better-auth/mcp";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { getDb } from "@/db";
import { getAuth } from "@/lib/auth";
import { MCP_SCOPES, mcpResource } from "@/lib/auth/config";
import { createTasklyServer } from "@/lib/mcp/server";
import { reminderDeps } from "@/lib/reminders/runtime";
import { syncTaskReminders } from "@/lib/reminders/service";
import { getBaseUrl } from "@/lib/url";

/**
 * The MCP endpoint Claude calls (docs/connect-claude.md). Every request
 * carries an OAuth access token bound to this resource; the verified `sub`
 * claim is the Taskly user the tools act for.
 */
const mcp = createMcpHandler(
  ({ authInfo }) => {
    const userId = String(authInfo?.extra?.userId ?? "");
    if (!userId) throw new Error("Missing user");
    return createTasklyServer({
      db: getDb(),
      userId,
      onTaskChanged: async (taskId) => {
        try {
          await syncTaskReminders(reminderDeps(), userId, taskId);
        } catch (error) {
          console.error(`Reminder sync failed for task ${taskId}`, error);
        }
      },
    });
  },
  // Serve both the 2026-07-28 protocol and 2025-era clients.
  { legacy: "stateless", onerror: (error) => console.error("MCP error", error) },
);

function handle(request: Request) {
  const guarded = requireMcpAuth(
    getAuth(),
    (req, claims) =>
      mcp.fetch(req, {
        authInfo: {
          token: "",
          clientId: String(claims.azp ?? claims.client_id ?? ""),
          scopes: String(claims.scope ?? "").split(" ").filter(Boolean),
          expiresAt: typeof claims.exp === "number" ? claims.exp : undefined,
          extra: { userId: claims.sub },
        },
      }),
    { resource: mcpResource(getBaseUrl()), requiredScopes: MCP_SCOPES },
  );
  return guarded(request);
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
