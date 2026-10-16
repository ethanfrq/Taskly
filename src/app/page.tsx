import { Logo } from "@/components/brand/logo";
import { LanguageSwitch } from "@/components/language-switch";
import { SignOutButton } from "@/components/sign-out-button";
import { buttonClass } from "@/components/ui/button";
import { format } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/auth/session";

const REPO_URL = "https://github.com/ethanfrq/Taskly";
const PROTOTYPE_URL =
  "https://htmlpreview.github.io/?https://github.com/ethanfrq/Taskly/blob/main/docs/design/prototype.html";

export default async function Home() {
  const { t } = await getI18n();
  const session = await getSession();
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 text-center">
        <h1>
          <Logo className="mx-auto h-12 w-auto" />
        </h1>
        <p className="mt-5 text-text-secondary">{t.common.tagline}</p>
        <p className="mt-6 inline-block rounded-full bg-fill px-3 py-1 text-sm">{t.home.status}</p>
        <div className="mt-8 flex flex-col gap-2">
          <a
            href={PROTOTYPE_URL}
            className="rounded-xl bg-accent px-4 py-3 font-medium text-on-accent"
          >
            {t.home.viewPrototype}
          </a>
          <a href={REPO_URL} className="rounded-xl px-4 py-3 font-medium text-accent-text">
            {t.home.sourceCode}
          </a>
        </div>
        <div className="mt-6 border-t border-separator pt-6">
          {session ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-text-secondary">
                {format(t.auth.signedInAs, { email: session.user.email })}
              </p>
              <SignOutButton />
            </div>
          ) : (
            <a href="/sign-in" className={buttonClass("secondary")}>
              {t.auth.signIn}
            </a>
          )}
        </div>
        <div className="mt-6">
          <LanguageSwitch />
        </div>
      </div>
    </main>
  );
}
