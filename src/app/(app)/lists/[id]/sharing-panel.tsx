"use client";

import { IconCheck, IconCopy, IconLink, IconLinkOff, IconUsers } from "@tabler/icons-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/format";
import type { Participant } from "@/lib/tasks/service";
import { disableInviteAction, leaveListAction, removeMemberAction, shareListAction } from "../../actions";

type Props = {
  list: { id: string; name: string };
  isOwner: boolean;
  inviteToken: string | null;
  participants: Participant[];
  meId: string;
  origin: string;
};

/** Invite link and people for a list (owner), or "leave" for a member. */
export function SharingPanel({ list, isOwner, inviteToken, participants, meId, origin }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(inviteToken);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const shared = participants.length > 1 || !!token;
  const link = token ? `${origin}/join/${token}` : null;

  const copy = async () => {
    if (!link) return;
    if (navigator.share) {
      await navigator.share({ title: format(t.sharing.title, { name: list.name }), url: link }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-[14px] font-medium text-accent-text"
      >
        <IconUsers size={18} stroke={1.8} aria-hidden />
        {shared ? participants.length : t.sharing.share}
      </button>
    );
  }

  return (
    <div className="mt-3 flex w-full flex-col gap-3 rounded-xl bg-card p-4">
      <p className="text-[17px] font-semibold">{format(t.sharing.title, { name: list.name })}</p>
      {isOwner ? (
        <>
          <p className="text-[14px] text-text-secondary">{t.sharing.body}</p>
          {link ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-[10px] bg-fill px-3 py-2.5">
                <IconLink size={16} stroke={1.8} className="shrink-0 text-text-secondary" aria-hidden />
                <code className="min-w-0 flex-1 truncate text-[13px]">{link}</code>
              </div>
              <Button onClick={copy}>
                {copied ? <IconCheck size={18} aria-hidden /> : <IconCopy size={18} aria-hidden />}
                {copied ? t.sharing.copied : t.sharing.copy}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="plain"
                  disabled={pending}
                  onClick={() => startTransition(async () => setToken((await shareListAction(list.id)).token))}
                  className="text-[13px]"
                >
                  {t.sharing.newLink}
                </Button>
                <Button
                  variant="plain"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await disableInviteAction(list.id);
                      setToken(null);
                    })
                  }
                  className="text-[13px]"
                >
                  <IconLinkOff size={16} aria-hidden />
                  {t.sharing.disableLink}
                </Button>
              </div>
            </div>
          ) : (
            <Button disabled={pending} onClick={() => startTransition(async () => setToken((await shareListAction(list.id)).token))}>
              {t.sharing.createLink}
            </Button>
          )}
        </>
      ) : null}

      <div>
        <p className="pb-1.5 text-[13px] text-text-secondary">{t.sharing.people}</p>
        <ul className="divide-y divide-separator overflow-hidden rounded-[10px] bg-fill">
          {participants.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-card text-[13px] font-semibold uppercase" aria-hidden>
                {(p.name || p.email).slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px]">
                  {p.name || p.email}
                  {p.id === meId ? ` (${t.sharing.you})` : ""}
                </span>
                {p.isOwner ? <span className="block text-[12px] text-text-secondary">{t.sharing.owner}</span> : null}
              </span>
              {isOwner && !p.isOwner ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => removeMemberAction(list.id, p.id))}
                  className="text-[14px] text-danger"
                >
                  {t.sharing.remove}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[12px] text-text-secondary">{t.sharing.conflicts}</p>

      {!isOwner ? (
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() => {
            if (!window.confirm(format(t.sharing.leaveConfirm, { name: list.name }))) return;
            startTransition(() => leaveListAction(list.id));
          }}
        >
          {t.sharing.leave}
        </Button>
      ) : null}
      <Button variant="plain" onClick={() => setOpen(false)}>
        {t.common.back}
      </Button>
    </div>
  );
}
