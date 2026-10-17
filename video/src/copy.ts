export type Lang = "fr" | "en";

export type SourceKind = "gmail" | "outlook" | "calendar" | "slack" | "teams" | "notion";

export type Copy = {
  hook: { eyebrow: string; counts: { n: number; label: string }[]; punch: string };
  chaos: { line1: string; line2: string; cards: { kind: SourceKind; from: string; text: string; when: string }[] };
  reveal: { tagline: string; sub: string };
  demo: {
    a: { title: string; prompt: string; sent: string };
    b: { title: string; sources: { kind: SourceKind; label: string }[] };
    c: { title: string; sub: string };
    d: { title: string; sub: string };
  };
  values: { title: string; pills: string[] };
  outro: { tagline: string; url: string; small: string; disclaimer: string };
  phone: {
    date: string;
    title: string;
    done: string;
    next: string;
    nextTask: string;
    banner: string;
    undo: string;
    section: string;
    newTask: string;
    tabs: string[];
    tasks: { title: string; time?: string; source?: SourceKind; sourceLabel?: string; priority?: boolean; byClaude?: boolean }[];
    notification: { app: string; when: string; title: string; body: string };
  };
};

export const copy: Record<Lang, Copy> = {
  fr: {
    hook: {
      eyebrow: "Ce matin, dans ta poche :",
      counts: [
        { n: 47, label: "mails" },
        { n: 12, label: "messages" },
        { n: 3, label: "réunions" },
      ],
      punch: "Et aucune liste.",
    },
    chaos: {
      line1: "Tout est là.",
      line2: "À toi de trier.",
      cards: [
        { kind: "gmail", from: "Dupont SAS", text: "Devis signé, retour avant 10h30 ?", when: "08:12" },
        { kind: "slack", from: "Sarah", text: "tu peux me répondre sur le budget ?", when: "08:14" },
        { kind: "calendar", from: "Point équipe", text: "16:00 – 16:30 · Salle B", when: "Auj." },
        { kind: "teams", from: "Marc", text: "Les slides de la démo sont prêtes ?", when: "08:20" },
        { kind: "outlook", from: "Compta", text: "Facture n°2210 en attente", when: "08:21" },
        { kind: "notion", from: "Roadmap Q4", text: "3 nouveaux commentaires", when: "08:25" },
        { kind: "gmail", from: "Léa", text: "PR onboarding à relire quand tu peux", when: "08:31" },
        { kind: "slack", from: "#général", text: "12 nouveaux messages", when: "08:33" },
        { kind: "calendar", from: "Dentiste", text: "Demain 9:00", when: "Dem." },
        { kind: "gmail", from: "Newsletter", text: "Les 10 tendances de la rentrée…", when: "08:40" },
        { kind: "teams", from: "RH", text: "Entretien annuel à planifier", when: "08:44" },
        { kind: "gmail", from: "Banque", text: "Votre relevé est disponible", when: "08:47" },
        { kind: "slack", from: "Paul", text: "on s'appelle demain 14h ?", when: "08:52" },
        { kind: "outlook", from: "Client", text: "Re: Re: Re: contrat", when: "08:55" },
      ],
    },
    reveal: { tagline: "Ta journée, triée par Claude.", sub: "Gratuit · Open source" },
    demo: {
      a: { title: "Une phrase, chaque matin.", prompt: "Prépare ma journée dans Taskly", sent: "Envoyé" },
      b: {
        title: "Claude lit tes mails, ton agenda, tes messages.",
        sources: [
          { kind: "gmail", label: "Gmail" },
          { kind: "outlook", label: "Outlook" },
          { kind: "calendar", label: "Google Agenda" },
          { kind: "slack", label: "Slack" },
          { kind: "teams", label: "Teams" },
          { kind: "notion", label: "Notion" },
        ],
      },
      c: { title: "Chaque tâche reliée à sa source.", sub: "Un geste pour annuler. Zéro doublon." },
      d: { title: "Des rappels qui sonnent vraiment.", sub: "À la minute près, même Claude fermé." },
    },
    values: {
      title: "Des tâches, pas des mails.",
      pills: ["Open source · MIT", "Pas de mot de passe", "Déconnecte Claude en un geste"],
    },
    outro: {
      tagline: "Ta journée, triée par Claude.",
      url: "taskly-day.vercel.app",
      small: "Gratuit · Open source · github.com/ethanfrq/Taskly",
      disclaimer: "Projet indépendant, non affilié à Anthropic. Claude est une marque d'Anthropic.",
    },
    phone: {
      date: "Samedi 17 octobre",
      title: "Aujourd'hui",
      done: "faites",
      next: "Prochain",
      nextTask: "Envoyer le devis à Dupont",
      banner: "Claude a ajouté 3 tâches depuis Gmail, Agenda, Slack",
      undo: "Annuler",
      section: "À faire",
      newTask: "Nouvelle tâche",
      tabs: ["Aujourd'hui", "Agenda", "Listes", "Réglages"],
      tasks: [
        { title: "Envoyer le devis à Dupont", time: "10:30", source: "gmail", sourceLabel: "Gmail", priority: true, byClaude: true },
        { title: "Ordre du jour du point équipe", time: "16:00", source: "calendar", sourceLabel: "Agenda", byClaude: true },
        { title: "Répondre à Sarah", source: "slack", sourceLabel: "Slack", priority: true, byClaude: true },
        { title: "Préparer les slides de la démo" },
        { title: "Acheter le cadeau de Maman" },
      ],
      notification: { app: "TASKLY", when: "maintenant", title: "Envoyer le devis à Dupont", body: "10:30 · Gmail" },
    },
  },
  en: {
    hook: {
      eyebrow: "This morning, in your pocket:",
      counts: [
        { n: 47, label: "emails" },
        { n: 12, label: "messages" },
        { n: 3, label: "meetings" },
      ],
      punch: "And no list.",
    },
    chaos: {
      line1: "It's all there.",
      line2: "You sort it out.",
      cards: [
        { kind: "gmail", from: "Dupont Ltd", text: "Signed quote, back before 10:30?", when: "08:12" },
        { kind: "slack", from: "Sarah", text: "can you get back to me on the budget?", when: "08:14" },
        { kind: "calendar", from: "Team sync", text: "4:00 – 4:30 PM · Room B", when: "Today" },
        { kind: "teams", from: "Marc", text: "Are the demo slides ready?", when: "08:20" },
        { kind: "outlook", from: "Accounting", text: "Invoice #2210 pending", when: "08:21" },
        { kind: "notion", from: "Q4 roadmap", text: "3 new comments", when: "08:25" },
        { kind: "gmail", from: "Léa", text: "Onboarding PR to review when you can", when: "08:31" },
        { kind: "slack", from: "#general", text: "12 new messages", when: "08:33" },
        { kind: "calendar", from: "Dentist", text: "Tomorrow 9:00 AM", when: "Tmrw" },
        { kind: "gmail", from: "Newsletter", text: "10 trends to watch this fall…", when: "08:40" },
        { kind: "teams", from: "HR", text: "Annual review to schedule", when: "08:44" },
        { kind: "gmail", from: "Bank", text: "Your statement is available", when: "08:47" },
        { kind: "slack", from: "Paul", text: "call tomorrow at 2pm?", when: "08:52" },
        { kind: "outlook", from: "Client", text: "Re: Re: Re: contract", when: "08:55" },
      ],
    },
    reveal: { tagline: "Your day, sorted by Claude.", sub: "Free · Open source" },
    demo: {
      a: { title: "One sentence, every morning.", prompt: "Prepare my day in Taskly", sent: "Sent" },
      b: {
        title: "Claude reads your mail, calendar and messages.",
        sources: [
          { kind: "gmail", label: "Gmail" },
          { kind: "outlook", label: "Outlook" },
          { kind: "calendar", label: "Google Calendar" },
          { kind: "slack", label: "Slack" },
          { kind: "teams", label: "Teams" },
          { kind: "notion", label: "Notion" },
        ],
      },
      c: { title: "Every task linked to its source.", sub: "One tap to undo. No duplicates." },
      d: { title: "Reminders that actually ring.", sub: "To the minute, even with Claude closed." },
    },
    values: {
      title: "Tasks, not emails.",
      pills: ["Open source · MIT", "No password, ever", "Disconnect Claude in one tap"],
    },
    outro: {
      tagline: "Your day, sorted by Claude.",
      url: "taskly-day.vercel.app",
      small: "Free · Open source · github.com/ethanfrq/Taskly",
      disclaimer: "An independent project, not affiliated with Anthropic. Claude is a trademark of Anthropic.",
    },
    phone: {
      date: "Saturday, October 17",
      title: "Today",
      done: "done",
      next: "Next",
      nextTask: "Send the quote to Dupont",
      banner: "Claude added 3 tasks from Gmail, Calendar, Slack",
      undo: "Undo",
      section: "To do",
      newTask: "New task",
      tabs: ["Today", "Agenda", "Lists", "Settings"],
      tasks: [
        { title: "Send the quote to Dupont", time: "10:30", source: "gmail", sourceLabel: "Gmail", priority: true, byClaude: true },
        { title: "Team sync agenda", time: "16:00", source: "calendar", sourceLabel: "Calendar", byClaude: true },
        { title: "Reply to Sarah", source: "slack", sourceLabel: "Slack", priority: true, byClaude: true },
        { title: "Prepare the demo slides" },
        { title: "Buy Mom's gift" },
      ],
      notification: { app: "TASKLY", when: "now", title: "Send the quote to Dupont", body: "10:30 · Gmail" },
    },
  },
};
