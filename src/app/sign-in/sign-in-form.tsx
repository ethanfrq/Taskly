"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/format";
import { authClient } from "@/lib/auth/client";
import {
  type PasskeyKind,
  canAutofillPasskeys,
  canUsePasskeys,
  passkeyKind,
  passkeySavedOnDevice,
  rememberPasskeyOnDevice,
} from "@/lib/auth/passkey-support";

type Step = "start" | "code" | "passkey-offer";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errorMessage(err: { code?: string; status?: number }, t: ReturnType<typeof useI18n>["t"]) {
  // Per-IP limits answer 429 without a code; the per-address cap says TOO_MANY_CODES.
  if (err.status === 429 || err.code === "TOO_MANY_CODES") return t.auth.errors.tooManyRequests;
  if (err.code === "EMAIL_NOT_ALLOWED") return t.auth.errors.notAllowed;
  switch (err.code) {
    case "INVALID_OTP":
      return t.auth.errors.invalidCode;
    case "OTP_EXPIRED":
      return t.auth.errors.expiredCode;
    case "TOO_MANY_ATTEMPTS":
      return t.auth.errors.tooManyAttempts;
    case "INVALID_EMAIL":
      return t.auth.errors.invalidEmail;
    default:
      return t.auth.errors.generic;
  }
}

export function SignInForm({
  next,
  oauth = false,
  codeInLogs = false,
}: {
  next: string;
  oauth?: boolean;
  /** No email provider: the code is in the server logs, say so instead of "sent to". */
  codeInLogs?: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState<Step>("start");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeyKind | null>(null);
  // The explicit button only for a device that has a passkey (see passkeySavedOnDevice).
  const [savedPasskey, setSavedPasskey] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    canUsePasskeys().then((ok) => {
      setPasskeys(ok ? passkeyKind(navigator.userAgent) : null);
      setSavedPasskey(ok && passkeySavedOnDevice());
    });
  }, []);

  const finish = () => {
    // During an OAuth authorization the auth client already follows the redirect back to Claude.
    if (oauth) return;
    router.replace(next);
    router.refresh();
  };

  // Passkeys saved for this site show up in the email field's suggestions,
  // and nothing shows when there are none: no system dialog on a new device.
  useEffect(() => {
    let active = true;
    canAutofillPasskeys().then(async (ok) => {
      if (!ok || !active) return;
      const { error: err } = await authClient.signIn.passkey({ autoFill: true });
      if (err || !active) return;
      rememberPasskeyOnDevice();
      if (oauth) return;
      router.replace(next);
      router.refresh();
    });
    return () => {
      active = false;
    };
  }, [oauth, next, router]);

  const passkeyLabel =
    passkeys === "face-id"
      ? t.auth.continueWithFaceId
      : passkeys === "touch-id"
        ? t.auth.continueWithTouchId
        : t.auth.continueWithPasskey;

  const signInWithPasskey = () =>
    startTransition(async () => {
      setError(null);
      const { error: err } = await authClient.signIn.passkey();
      if (!err) rememberPasskeyOnDevice();
      if (err) {
        const cancelled = "code" in err && err.code === "AUTH_CANCELLED";
        const method = passkeys === "face-id" ? "Face ID" : passkeys === "touch-id" ? "Touch ID" : t.auth.passkeyGeneric;
        setError(format(cancelled ? t.auth.errors.passkeyCancelled : t.auth.errors.passkeyFailed, { method }));
        return;
      }
      finish();
    });

  const sendCode = (event?: FormEvent) => {
    event?.preventDefault();
    const address = email.trim().toLowerCase();
    if (!EMAIL.test(address)) {
      setError(t.auth.errors.invalidEmail);
      return;
    }
    startTransition(async () => {
      setError(null);
      const { error: err } = await authClient.emailOtp.sendVerificationOtp({ email: address, type: "sign-in" });
      if (err) {
        setError(errorMessage(err, t));
        return;
      }
      setEmail(address);
      if (step === "code") setNotice(t.auth.codeResent);
      setStep("code");
    });
  };

  const verifyCode = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError(t.auth.errors.invalidCode);
      return;
    }
    startTransition(async () => {
      setError(null);
      const { error: err } = await authClient.signIn.emailOtp({ email, otp: code });
      if (err) {
        setError(errorMessage(err, t));
        return;
      }
      if (passkeys && !oauth) setStep("passkey-offer");
      else finish();
    });
  };

  const addPasskey = () =>
    startTransition(async () => {
      const { error: err } = await authClient.passkey.addPasskey();
      if (!err) rememberPasskeyOnDevice();
      finish();
    });

  if (step === "passkey-offer") {
    return (
      <div className="flex flex-1 flex-col">
        <h1 className="text-[28px] font-semibold tracking-tight">
          {format(t.auth.passkeyOfferTitle, {
            method: passkeys === "face-id" ? "Face ID" : passkeys === "touch-id" ? "Touch ID" : t.auth.passkeyGeneric,
          })}
        </h1>
        <p className="mt-2 text-text-secondary">{t.auth.passkeyOfferBody}</p>
        <div className="mt-auto flex flex-col gap-2 pt-8">
          <Button onClick={addPasskey} disabled={pending}>
            {t.auth.passkeyOfferAccept}
          </Button>
          <Button variant="plain" onClick={finish} disabled={pending}>
            {t.common.later}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "code") {
    return (
      <form onSubmit={verifyCode} className="flex flex-1 flex-col" noValidate>
        <h1 className="text-[28px] font-semibold tracking-tight">{codeInLogs ? t.auth.codeInLogsTitle : t.auth.codeTitle}</h1>
        <p className="mt-2 text-text-secondary">{codeInLogs ? t.auth.codeInLogs : format(t.auth.codeSubtitle, { email })}</p>
        <div className="mt-8">
          <Field
            id="otp"
            label={t.auth.codeLabel}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setError(null);
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            autoFocus
            placeholder="••••••"
            className="text-center text-[24px] tracking-[0.5em]"
            error={error}
          />
          {notice ? (
            <p role="status" className="mt-2 px-1 text-[13px] text-text-secondary">
              {notice}
            </p>
          ) : null}
        </div>
        <div className="mt-auto flex flex-col gap-2 pt-8">
          <Button type="submit" disabled={pending}>
            {t.auth.verify}
          </Button>
          <Button variant="plain" onClick={() => sendCode()} disabled={pending}>
            {t.auth.resendCode}
          </Button>
          <Button
            variant="plain"
            onClick={() => {
              setStep("start");
              setCode("");
              setError(null);
              setNotice(null);
            }}
            disabled={pending}
          >
            {t.auth.changeEmail}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="flex flex-1 flex-col" noValidate>
      <h1 className="text-[28px] font-semibold tracking-tight">{t.auth.signInTitle}</h1>
      <p className="mt-2 text-text-secondary">{codeInLogs ? t.auth.signInSubtitleNoEmail : t.auth.signInSubtitle}</p>
      <div className="mt-8 flex flex-col gap-3">
        {passkeys && savedPasskey ? (
          <>
            <Button onClick={signInWithPasskey} disabled={pending}>
              {passkeyLabel}
            </Button>
            <div className="flex items-center gap-3 text-[13px] text-text-secondary">
              <span className="h-px flex-1 bg-separator" />
              {t.auth.or}
              <span className="h-px flex-1 bg-separator" />
            </div>
          </>
        ) : null}
        <Field
          id="email"
          label={t.auth.emailLabel}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          autoComplete="email webauthn"
          inputMode="email"
          placeholder={t.auth.emailPlaceholder}
          error={error}
        />
        <Button type="submit" variant={passkeys && savedPasskey ? "secondary" : "primary"} disabled={pending}>
          {t.auth.sendCode}
        </Button>
      </div>
      <p className="mt-auto pt-8 text-center text-[12px] text-text-secondary">
        {t.auth.legal}{" "}
        <a href="/terms" className="text-accent-text">
          {t.privacy.terms}
        </a>
        {" · "}
        <a href="/privacy" className="text-accent-text">
          {t.privacy.policy}
        </a>
      </p>
    </form>
  );
}
