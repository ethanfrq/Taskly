"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { getAuth } from "@/lib/auth";
import { requireUser } from "@/lib/auth/session";
import { deleteUserData } from "@/lib/privacy";

/** Deletes the account after the user typed their email (GDPR right to erasure). */
export async function deleteAccountAction(confirmEmail: string): Promise<{ error: "mismatch" } | never> {
  const user = await requireUser();
  if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) return { error: "mismatch" };
  await getAuth()
    .api.signOut({ headers: await headers() })
    .catch(() => undefined);
  await deleteUserData(getDb(), user.id);
  redirect("/?deleted=1");
}
