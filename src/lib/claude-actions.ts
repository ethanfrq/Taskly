"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth/session";
import { disconnectClaude } from "@/lib/claude-access";

/** Settings › Connect Claude › Disconnect: Claude loses access right away. */
export async function disconnectClaudeAction(): Promise<void> {
  const user = await requireUser();
  await disconnectClaude(getDb(), user.id);
  revalidatePath("/settings");
  revalidatePath("/settings/claude");
}
