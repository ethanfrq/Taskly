import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAuth } from ".";

/** The current session, or null. Deduplicated within a render. */
export const getSession = cache(async () => {
  return getAuth().api.getSession({ headers: await headers() });
});

/**
 * The signed-in user, or a redirect to sign-in. Call it in every page,
 * Server Action and Route Handler that touches user data.
 */
export async function requireUser(returnTo?: string) {
  const session = await getSession();
  if (!session) {
    redirect(returnTo ? `/sign-in?next=${encodeURIComponent(returnTo)}` : "/sign-in");
  }
  return session.user;
}
