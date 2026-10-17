import { IconBell, IconBellRinging, IconFlag, IconRepeat, IconSparkles } from "@tabler/icons-react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { copy as promo, type Lang, type OutroCopy } from "../copy";
import { Film, type Scene } from "../film";
import { progress, Rise, useLayout, useSceneFrame } from "../motion";
import { Outro } from "../scenes/Outro";
import { colors } from "../theme";
import { CopyAndPhone } from "../ui/layout";
import { LockScreen } from "../ui/screens/LockScreen";
import { RhythmScreen, type RhythmCopy } from "../ui/screens/RhythmScreen";
import { Body, Display } from "../ui/text";

type Notif = { title: string; body: string; when: string };

export type RemCopy = {
  tabs: string[];
  app: string;
  hook: { hour: string; minutes: number[]; line: string; sub: string };
  followUp: { title: string; sub: string; chips: string[]; time: string; date: string; first: Notif; second: Notif };
  quiet: { title: string; sub: string; rhythm: RhythmCopy; toast: string };
  morning: { title: string; sub: string; prompt: string; time: string; date: string; notif: Notif };
  outro: OutroCopy;
};

const disclaimer = {
  fr: "Projet indépendant, non affilié à Anthropic. Claude est une marque d'Anthropic.",
  en: "An independent project, not affiliated with Anthropic. Claude is a trademark of Anthropic.",
};

export const REM: Record<Lang, RemCopy> = {
  fr: {
    tabs: promo.fr.phone.tabs,
    app: "TASKLY",
    hook: { hour: "10", minutes: [27, 28, 29, 30], line: "À la minute près.", sub: "Même l'app fermée. Même Claude fermé." },
    followUp: {
      title: "Une relance pour ce qui compte.",
      sub: "Pas coché au bout de 15 minutes ? Taskly revient. Une fois, deux fois, ou jusqu'à ce que ce soit fait : tu choisis.",
      chips: ["Un rappel à l'heure", "Une relance 15 min après", "Prioritaires seulement"],
      time: "10:45",
      date: "Samedi 17 octobre",
      first: { title: "Envoyer le devis à Dupont", body: "10:30 · Gmail", when: "10:30" },
      second: { title: "Envoyer le devis à Dupont", body: "Relance 1 sur 1 · prévu à 10:30", when: "maintenant" },
    },
    quiet: {
      title: "Des heures calmes, vraies.",
      sub: "De 21:00 à 07:00, rien ne sonne. Ce qui tombe la nuit attend le matin : rien n'est perdu.",
      rhythm: {
        settingsTitle: "Réglages",
        title: "Ton rythme",
        briefing: "Briefing du matin",
        review: "Bilan du soir",
        quietHours: "Heures calmes",
        insistence: "Insistance des rappels",
        discreet: "Discret",
        insistent: "Insistant",
        level: "2 · Un rappel, puis une relance 15 min après",
        priorityOnly: "Relancer seulement les prioritaires",
        priorityOnlyHint: "Les autres tâches ont un seul rappel.",
        times: { briefing: "07:30", review: "18:30", quietFrom: "21:00", quietTo: "07:00" },
      },
      toast: "Rappel reporté à 07:00",
    },
    morning: {
      title: "07:30. Le briefing ouvre Claude.",
      sub: "Une notification, un geste, et Claude prépare ta journée.",
      prompt: "Prépare ma journée dans Taskly",
      time: "07:30",
      date: "Lundi 19 octobre",
      notif: { title: "Bonjour. On prépare ta journée ?", body: "Demande à Claude : « Prépare ma journée dans Taskly »", when: "07:30" },
    },
    outro: { tagline: "Des rappels qui sonnent vraiment.", url: "taskly-day.vercel.app", small: "Gratuit · Open source · github.com/ethanfrq/Taskly", disclaimer: disclaimer.fr },
  },
  en: {
    tabs: promo.en.phone.tabs,
    app: "TASKLY",
    hook: { hour: "10", minutes: [27, 28, 29, 30], line: "To the minute.", sub: "Even with the app closed. Even with Claude closed." },
    followUp: {
      title: "A follow-up for what matters.",
      sub: "Not ticked after 15 minutes? Taskly comes back. Once, twice, or until it's done: your call.",
      chips: ["One reminder, on time", "A follow-up 15 min later", "Priority tasks only"],
      time: "10:45",
      date: "Saturday, October 17",
      first: { title: "Send the quote to Dupont", body: "10:30 · Gmail", when: "10:30" },
      second: { title: "Send the quote to Dupont", body: "Follow-up 1 of 1 · due at 10:30", when: "now" },
    },
    quiet: {
      title: "Quiet hours, for real.",
      sub: "From 21:00 to 07:00, nothing rings. What lands at night waits for the morning: nothing is lost.",
      rhythm: {
        settingsTitle: "Settings",
        title: "Your rhythm",
        briefing: "Morning briefing",
        review: "Evening review",
        quietHours: "Quiet hours",
        insistence: "Reminder insistence",
        discreet: "Discreet",
        insistent: "Insistent",
        level: "2 · One reminder, then a follow-up 15 min later",
        priorityOnly: "Only follow up on priority tasks",
        priorityOnlyHint: "Other tasks get a single reminder.",
        times: { briefing: "07:30", review: "18:30", quietFrom: "21:00", quietTo: "07:00" },
      },
      toast: "Reminder deferred to 07:00",
    },
    morning: {
      title: "07:30. The briefing opens Claude.",
      sub: "One notification, one tap, and Claude prepares your day.",
      prompt: "Prepare my day in Taskly",
      time: "07:30",
      date: "Monday, October 19",
      notif: { title: "Good morning. Shall we plan your day?", body: "Ask Claude: “Prepare my day in Taskly”", when: "07:30" },
    },
    outro: { tagline: "Reminders that actually ring.", url: "taskly-day.vercel.app", small: "Free · Open source · github.com/ethanfrq/Taskly", disclaimer: disclaimer.en },
  },
};

/** 10:27, 10:28, 10:29, 10:30: the bell rings on the minute. */
function RemHook({ c }: { c: RemCopy }) {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const { portrait } = useLayout();
  const idx = Math.min(c.hook.minutes.length - 1, Math.max(0, Math.floor(frame / 10)));
  const bump = 1 - progress(frame, idx * 10, 8);
  const pop = spring({ frame: Math.max(0, frame - 32), fps, config: { damping: 12, stiffness: 160 } });
  const swing = interpolate(frame, [34, 40, 46, 52, 58], [0, -16, 12, -6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: colors.bg, justifyContent: "center", alignItems: "center", padding: "0 80px", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: portrait ? 20 : 32 }}>
        <Display size={portrait ? 180 : 230} style={{ fontVariantNumeric: "tabular-nums", transform: `translateY(${bump * -18}px)` }}>
          {c.hook.hour}:{String(c.hook.minutes[idx]).padStart(2, "0")}
        </Display>
        <IconBellRinging size={portrait ? 100 : 130} stroke={1.6} color={colors.accent} style={{ opacity: pop, transform: `scale(${pop}) rotate(${swing}deg)`, flex: "none" }} />
      </div>
      <Rise at={40} style={{ marginTop: 28 }}>
        <Display size={portrait ? 80 : 96}>{c.hook.line}</Display>
      </Rise>
      <Rise at={66} style={{ marginTop: 22 }}>
        <Body size={portrait ? 36 : 40}>{c.hook.sub}</Body>
      </Rise>
    </AbsoluteFill>
  );
}

function RemFollowUp({ c }: { c: RemCopy }) {
  const frame = useSceneFrame();
  const f = c.followUp;
  const icons = [IconBell, IconRepeat, IconFlag];
  return (
    <CopyAndPhone
      title={f.title}
      sub={f.sub}
      chips={f.chips.map((label, i) => {
        const Icon = icons[i];
        return (
          <>
            <Icon size={26} stroke={1.8} color={colors.accent} />
            {label}
          </>
        );
      })}
    >
      <LockScreen
        time={f.time}
        date={f.date}
        app={c.app}
        frame={frame}
        notifications={[
          { ...f.first, at: 10 },
          { ...f.second, at: 74, bell: true },
        ]}
      />
    </CopyAndPhone>
  );
}

function RemQuiet({ c }: { c: RemCopy }) {
  const frame = useSceneFrame();
  return (
    <CopyAndPhone title={c.quiet.title} sub={c.quiet.sub}>
      <RhythmScreen c={c.quiet.rhythm} frame={frame} tabs={c.tabs} highlightAt={40} toast={{ at: 86, text: c.quiet.toast }} />
    </CopyAndPhone>
  );
}

function RemMorning({ c }: { c: RemCopy }) {
  const frame = useSceneFrame();
  const m = c.morning;
  return (
    <CopyAndPhone
      title={m.title}
      sub={m.sub}
      chipsAt={44}
      chips={[
        <>
          <IconSparkles size={26} stroke={1.8} color={colors.accent} />
          {m.prompt}
        </>,
      ]}
    >
      <LockScreen time={m.time} date={m.date} app={c.app} frame={frame} notifications={[{ ...m.notif, at: 16, bell: true }]} tapAt={90} />
    </CopyAndPhone>
  );
}

export const REMINDERS: Scene<RemCopy>[] = [
  { component: RemHook, frames: 105 },
  { component: RemFollowUp, frames: 165 },
  { component: RemQuiet, frames: 165 },
  { component: RemMorning, frames: 150 },
  { component: Outro, frames: 105 },
];

export function RemindersFilm({ lang }: { lang: Lang }) {
  return <Film scenes={REMINDERS} c={REM[lang]} />;
}
