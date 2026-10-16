"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { joinListAction } from "@/app/(app)/actions";

export function JoinButton({ token, label }: { token: string; label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button disabled={pending} onClick={() => startTransition(() => joinListAction(token))}>
      {label}
    </Button>
  );
}
