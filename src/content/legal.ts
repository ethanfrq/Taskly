import type { Locale } from "@/i18n/config";

export type LegalSection = { title: string; body: string[] };
export type LegalDoc = { title: string; intro: string; sections: LegalSection[] };

/**
 * Default privacy policy and terms for a Taskly instance. Whoever hosts an
 * instance is responsible for it and should adapt these texts (operator
 * name, contact, hosting region).
 */
export const PRIVACY: Record<Locale, LegalDoc> = {
  fr: {
    title: "Confidentialité",
    intro: "Taskly est un logiciel open source. Cette instance est gérée par la personne ou l'organisation qui l'héberge : c'est elle qui est responsable de tes données.",
    sections: [
      {
        title: "Ce que Taskly enregistre",
        body: [
          "Ton adresse email, pour te connecter et t'envoyer les codes de connexion.",
          "Tes tâches, listes, tags, rappels et réglages (couleur, horaires, fuseau horaire).",
          "Pour chaque appareil qui reçoit des notifications : l'adresse technique du service de notifications et le navigateur utilisé.",
          "Tes clés d'identification (Face ID, Touch ID) : seulement leur partie publique, jamais tes données biométriques, qui ne quittent pas ton appareil.",
          "Les événements d'agenda et les tâches que Claude ajoute, avec un lien vers leur source.",
        ],
      },
      {
        title: "Ce que Taskly n'enregistre jamais",
        body: [
          "Le contenu de tes emails, messages ou documents. Claude les lit avec ses propres connecteurs ; Taskly ne reçoit que la tâche qui en résulte.",
          "De mot de passe : il n'y en a pas.",
          "De cookie publicitaire ou de traceur tiers.",
        ],
      },
      {
        title: "Services utilisés par cette instance",
        body: [
          "Hébergement et base de données (par exemple Vercel et Neon).",
          "Envoi des emails de connexion (par exemple Resend).",
          "Envoi des notifications : le service de ton navigateur (Apple, Google ou Mozilla).",
          "Planification des rappels (par exemple Upstash QStash), qui ne reçoit que des identifiants techniques.",
        ],
      },
      {
        title: "Tes droits",
        body: [
          "Réglages › Mes données › Exporter : un fichier avec toutes tes données (droit d'accès et de portabilité).",
          "Réglages › Mes données › Supprimer mon compte : tout est effacé immédiatement (droit à l'effacement).",
          "Pour toute autre demande, contacte la personne ou l'organisation qui héberge cette instance.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy",
    intro: "Taskly is open-source software. This instance is run by the person or organization hosting it: they are responsible for your data.",
    sections: [
      {
        title: "What Taskly stores",
        body: [
          "Your email address, to sign you in and send sign-in codes.",
          "Your tasks, lists, tags, reminders and settings (color, times, time zone).",
          "For each device that receives notifications: the push service's technical address and the browser used.",
          "Your passkeys (Face ID, Touch ID): only their public part, never biometric data, which never leaves your device.",
          "Calendar events and tasks Claude adds, with a link to their source.",
        ],
      },
      {
        title: "What Taskly never stores",
        body: [
          "The content of your emails, messages or documents. Claude reads them with its own connectors; Taskly only receives the resulting task.",
          "Passwords: there are none.",
          "Advertising cookies or third-party trackers.",
        ],
      },
      {
        title: "Services this instance uses",
        body: [
          "Hosting and database (for example Vercel and Neon).",
          "Sign-in emails (for example Resend).",
          "Notifications: your browser's push service (Apple, Google or Mozilla).",
          "Reminder scheduling (for example Upstash QStash), which only receives technical identifiers.",
        ],
      },
      {
        title: "Your rights",
        body: [
          "Settings › My data › Export: a file with all your data (right of access and portability).",
          "Settings › My data › Delete my account: everything is erased right away (right to erasure).",
          "For anything else, contact the person or organization hosting this instance.",
        ],
      },
    ],
  },
};

export const TERMS: Record<Locale, LegalDoc> = {
  fr: {
    title: "Conditions d'utilisation",
    intro: "Taskly est fourni tel quel, gratuitement, sous licence MIT.",
    sections: [
      {
        title: "Utilisation",
        body: [
          "Taskly t'aide à organiser ta journée. Les rappels dépendent de ton appareil, de ton navigateur et des services de notifications : ne t'en sers pas pour des tâches où un oubli serait dangereux (médicaments, sécurité).",
          "Les tâches ajoutées par Claude peuvent contenir des erreurs : vérifie-les, et annule un import d'un geste si besoin.",
        ],
      },
      {
        title: "Ton compte",
        body: [
          "Tu es responsable de l'accès à ton email et à tes appareils.",
          "Tu peux supprimer ton compte à tout moment depuis les réglages.",
        ],
      },
      {
        title: "Responsabilité",
        body: [
          "Le logiciel est fourni sans garantie, comme le précise la licence MIT. La personne ou l'organisation qui héberge cette instance définit ses propres règles et en répond.",
        ],
      },
    ],
  },
  en: {
    title: "Terms of use",
    intro: "Taskly is provided as is, free of charge, under the MIT license.",
    sections: [
      {
        title: "Use",
        body: [
          "Taskly helps you organize your day. Reminders depend on your device, browser and push services: don't rely on them for tasks where forgetting would be dangerous (medication, safety).",
          "Tasks Claude adds may contain mistakes: check them, and undo an import in one tap if needed.",
        ],
      },
      {
        title: "Your account",
        body: ["You're responsible for access to your email and devices.", "You can delete your account at any time from Settings."],
      },
      {
        title: "Liability",
        body: [
          "The software comes without warranty, as stated in the MIT license. Whoever hosts this instance sets their own rules and answers for them.",
        ],
      },
    ],
  },
};
