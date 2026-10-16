"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { authClient } from "@/lib/auth/client";
import { clearOutbox } from "@/lib/offline/outbox";

export function SignOutButton() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="destructive"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await authClient.signOut();
          clearOutbox();
          navigator.serviceWorker?.controller?.postMessage({ type: "taskly:clear-pages" });
          router.replace("/sign-in");
          router.refresh();
        })
      }
    >
      {t.auth.signOut}
    </Button>
  );
}
