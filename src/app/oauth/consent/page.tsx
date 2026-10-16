import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/auth/session";
import { ConsentForm } from "./consent-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${t.consent.allow} · Taskly` };
}

/** OAuth consent: Claude (or another MCP client) asks to use the user's Taskly. */
export default async function ConsentPage({ searchParams }: PageProps<"/oauth/consent">) {
  const params = await searchParams;
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : v ? [[k, v]] : [])),
  ).toString();
  const session = await getSession();
  // Keep the signed OAuth query: sign-in resumes the authorization with it.
  if (!session) redirect(`/sign-in?${query}`);
  const scopes = typeof params.scope === "string" ? params.scope.split(" ") : [];
  const clientId = typeof params.client_id === "string" ? params.client_id : "";
  return <ConsentForm email={session.user.email} clientId={clientId} scopes={scopes} />;
}
