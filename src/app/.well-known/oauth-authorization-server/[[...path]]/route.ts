import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { getAuth } from "@/lib/auth";

/** RFC 8414 authorization server metadata at the origin root, for MCP clients. */
export function GET(request: Request) {
  return oauthProviderAuthServerMetadata(getAuth())(request);
}
