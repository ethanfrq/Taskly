import type { Locale } from "@/i18n/config";
import type { Email } from "@/lib/email";

/** The sign-in code email, in the visitor's language. */
export function signInCodeEmail(to: string, otp: string, locale: Locale): Email {
  if (locale === "en") {
    return {
      to,
      subject: `Your Taskly code: ${otp}`,
      text: [
        `Your Taskly sign-in code is ${otp}.`,
        "",
        "Type it in the app. It expires in 10 minutes.",
        "If you didn't ask for it, ignore this email: nobody can sign in without the code.",
      ].join("\n"),
    };
  }
  return {
    to,
    subject: `Ton code Taskly : ${otp}`,
    text: [
      `Ton code de connexion Taskly est ${otp}.`,
      "",
      "Tape-le dans l'app. Il expire dans 10 minutes.",
      "Si tu ne l'as pas demandé, ignore cet email : personne ne peut se connecter sans le code.",
    ].join("\n"),
  };
}
