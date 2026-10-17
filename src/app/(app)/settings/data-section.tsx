"use client";

import { IconDownload, IconTrash } from "@tabler/icons-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useI18n } from "@/i18n/client";
import { deleteAccountAction } from "@/lib/privacy-actions";

/** Export and account deletion (GDPR rights of access, portability and erasure). */
export function DataSection() {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section>
      <h2 className="px-4 pb-1.5 text-[13px] text-text-secondary">{t.privacy.sectionTitle}</h2>
      <div className="divide-y divide-separator overflow-hidden rounded-xl bg-card">
        <a href="/api/account/export" download className="flex items-center gap-3 px-4 py-3">
          <IconDownload size={20} stroke={1.8} className="text-accent-text" aria-hidden />
          <span className="flex-1">
            <span className="block text-[16px]">{t.privacy.export}</span>
            <span className="block text-[13px] text-text-secondary">{t.privacy.exportHint}</span>
          </span>
        </a>
        <button type="button" onClick={() => setConfirming(true)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-danger">
          <IconTrash size={20} stroke={1.8} aria-hidden />
          <span className="text-[16px]">{t.privacy.delete}</span>
        </button>
      </div>

      {confirming ? (
        <form
          className="mt-3 flex flex-col gap-3 rounded-xl bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const result = await deleteAccountAction(email);
              if (result?.error) setError(t.privacy.deleteMismatch);
            });
          }}
        >
          <p className="text-[17px] font-semibold">{t.privacy.deleteTitle}</p>
          <p className="text-[15px] text-text-secondary">{t.privacy.deleteBody}</p>
          <Field
            id="confirm-email"
            label={t.privacy.deleteConfirmLabel}
            placeholder={t.privacy.deleteConfirmLabel}
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            error={error}
            className="bg-fill"
          />
          <div className="flex gap-2">
            <Button variant="plain" onClick={() => setConfirming(false)}>
              {t.common.cancel}
            </Button>
            <button
              type="submit"
              disabled={pending || !email}
              className="inline-flex w-full items-center justify-center rounded-xl bg-danger px-4 py-3 text-[15px] font-medium text-white disabled:opacity-50"
            >
              {t.privacy.deleteConfirm}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
