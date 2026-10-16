import { getAuth } from "@/lib/auth";

/** RFC 9728 protected resource metadata for /api/mcp, served by the MCP plugin. */
export function GET(request: Request) {
  return getAuth().handler(request);
}
