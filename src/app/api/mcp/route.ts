import { requireMcpAuth } from "@better-auth/mcp";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { getDb } from "@/db";
import { getAuth } from "@/lib/auth";
import { MCP_SCOPES, mcpResource } from "@/lib/auth/config";
import { getDisconnectedAt, isRevoked } from "@/lib/claude-access";
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

/** RFC 6750 answer for a token the user revoked: Claude starts the OAuth flow again. */
function revoked(resource: string) {
  const url = new URL(resource);
  const metadata = `${url.origin}/.well-known/oauth-protected-resource${url.pathname}`;
  return Response.json(
    { error: "invalid_token", error_description: "Access was revoked in Taskly" },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer error="invalid_token", error_description="Access was revoked in Taskly", resource_metadata="${metadata}"`,
      },
    },
  );
}

function handle(request: Request) {
  const resource = mcpResource(getBaseUrl());
  const guarded = requireMcpAuth(
    getAuth(),
    async (req, claims) => {
      // Signed and unexpired isn't enough: the user may have disconnected Claude since.
      if (isRevoked(claims.iat, await getDisconnectedAt(getDb(), String(claims.sub)))) return revoked(resource);
      return mcp.fetch(req, {
        authInfo: {
          token: "",
          clientId: String(claims.azp ?? claims.client_id ?? ""),
          scopes: String(claims.scope ?? "").split(" ").filter(Boolean),
          expiresAt: typeof claims.exp === "number" ? claims.exp : undefined,
          extra: { userId: claims.sub },
        },
      });
    },
    { resource, requiredScopes: MCP_SCOPES },
  );
  return guarded(request);
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
