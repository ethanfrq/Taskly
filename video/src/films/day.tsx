import { IconCalendar, IconCirclePlus, IconClock, IconFlag } from "@tabler/icons-react";
import { AbsoluteFill } from "remotion";
import { copy as promo, type Lang, type OutroCopy } from "../copy";
import { Film, type Scene } from "../film";
import { progress, Rise, useLayout, useSceneFrame } from "../motion";
import { Outro } from "../scenes/Outro";
import { colors, font } from "../theme";
import { CopyAndPhone } from "../ui/layout";
import { AgendaScreen, type AgendaGroup } from "../ui/screens/AgendaScreen";
import { ReviewScreen, type ReviewCopy } from "../ui/screens/ReviewScreen";
import { StatsScreen, type StatsCopy } from "../ui/screens/StatsScreen";
import { Body, Display, Pill } from "../ui/text";

export type DayCopy = {
  tabs: string[];
  hook: { title: string; typed: string; chips: string[]; parsed: string };
  agenda: { title: string; sub: string; screenTitle: string; groups: AgendaGroup[] };
  review: { title: string; sub: string; screen: ReviewCopy };
  stats: { title: string; sub: string; screen: StatsCopy };
  outro: OutroCopy;
};

const CANCEL_AT = 84;

export const DAYC: Record<Lang, DayCopy> = {
  fr: {
    tabs: promo.fr.phone.tabs,
    hook: { title: "Écris comme tu parles.", typed: "Appeler Paul demain 14h !!", chips: ["Demain", "14:00", "Priorité haute"], parsed: "Date, heure, priorité : Taskly a compris." },
    agenda: {
      title: "Réunions et tâches, une seule timeline.",
      sub: "Les deux prochaines semaines, dans l'ordre. Une réunion annulée disparaît d'elle-même.",
      screenTitle: "Agenda",
      groups: [
        {
          label: "Aujourd'hui",
          items: [
            { kind: "task", title: "Envoyer le devis à Dupont", time: "10:30", source: "gmail", sourceLabel: "Gmail", priority: 3 },
            { kind: "event", time: "14:00", title: "Démo client Acme", place: "Visio", cancelAt: CANCEL_AT },
            { kind: "task", title: "Ordre du jour du point équipe", time: "16:00", source: "calendar", sourceLabel: "Agenda" },
            { kind: "event", time: "17:00", title: "Point équipe hebdo", place: "Salle B" },
            { kind: "task", title: "Répondre à Sarah", source: "slack", sourceLabel: "Slack", priority: 3 },
          ],
        },
        { label: "Lundi", items: [{ kind: "task", title: "Standup", list: "Travail", time: "09:30", recurring: true, priority: 2 }] },
      ],
    },
    review: {
      title: "Le soir, tu boucles.",
      sub: "Le bilan montre ce qui reste et le passe à demain, en un geste. Puis tu termines la journée.",
      screen: {
        date: "Samedi 17 octobre",
        title: "Bilan du soir",
        doneText: "7 sur 9",
        doneLabel: "tâches faites aujourd'hui",
        left: "Pas terminé",
        tasks: ["Répondre à Sarah", "Acheter le cadeau de Maman"],
        tomorrow: "Demain",
        tomorrowLabel: "Demain",
        plannedBefore: "0 tâche déjà prévue",
        plannedAfter: "2 tâches déjà prévues",
        moveAll: "Tout reporter à demain",
        finish: "Terminer la journée",
        finished: "Journée terminée",
      },
    },
    stats: {
      title: "Et tu vois ta semaine.",
      sub: "Série, taux de réalisation, temps de focus, et ce que Claude t'a aidé à faire.",
      screen: {
        title: "Ta semaine",
        doneLabel: "Tâches faites",
        streakLabel: "Série",
        streakValue: "5 jours",
        completionLabel: "Taux de réalisation",
        focusLabel: "Focus",
        focusValue: "1 h 40",
        perDay: "Tâches faites par jour",
        bestDay: "Meilleur jour : jeudi",
        fromClaude: "9 tâches de Claude terminées",
        topLists: "Listes les plus actives",
        lists: [["Travail", 14], ["Perso", 9]],
        days: ["D", "L", "M", "M", "J", "V", "S"],
      },
    },
    outro: { tagline: "Ta journée, du matin au soir.", url: "taskly-day.vercel.app", small: "Gratuit · Open source · github.com/ethanfrq/Taskly", disclaimer: "Projet indépendant, non affilié à Anthropic. Claude est une marque d'Anthropic." },
  },
  en: {
    tabs: promo.en.phone.tabs,
    hook: { title: "Write the way you talk.", typed: "Call Paul tomorrow 2pm !!", chips: ["Tomorrow", "14:00", "High priority"], parsed: "Date, time, priority: Taskly got it." },
    agenda: {
      title: "Meetings and tasks, one timeline.",
      sub: "The next two weeks, in order. A cancelled meeting disappears on its own.",
      screenTitle: "Agenda",
      groups: [
        {
          label: "Today",
          items: [
            { kind: "task", title: "Send the quote to Dupont", time: "10:30", source: "gmail", sourceLabel: "Gmail", priority: 3 },
            { kind: "event", time: "14:00", title: "Acme client demo", place: "Video call", cancelAt: CANCEL_AT },
            { kind: "task", title: "Team sync agenda", time: "16:00", source: "calendar", sourceLabel: "Calendar" },
            { kind: "event", time: "17:00", title: "Weekly team sync", place: "Room B" },
            { kind: "task", title: "Reply to Sarah", source: "slack", sourceLabel: "Slack", priority: 3 },
          ],
        },
        { label: "Monday", items: [{ kind: "task", title: "Standup", list: "Work", time: "09:30", recurring: true, priority: 2 }] },
      ],
    },
    review: {
      title: "In the evening, you close the loop.",
      sub: "The review shows what's left and moves it to tomorrow in one tap. Then you end the day.",
      screen: {
        date: "Saturday, October 17",
        title: "Evening review",
        doneText: "7 of 9",
        doneLabel: "tasks done today",
        left: "Not finished",
        tasks: ["Reply to Sarah", "Buy Mom's gift"],
        tomorrow: "Tomorrow",
        tomorrowLabel: "Tomorrow",
        plannedBefore: "0 tasks already planned",
        plannedAfter: "2 tasks already planned",
        moveAll: "Move all to tomorrow",
        finish: "End the day",
        finished: "Day done",
      },
    },
    stats: {
      title: "And you see your week.",
      sub: "Streak, completion rate, focus time, and what Claude helped you get done.",
      screen: {
        title: "Your week",
        doneLabel: "Tasks done",
        streakLabel: "Streak",
        streakValue: "5 days",
        completionLabel: "Completion rate",
        focusLabel: "Focus",
        focusValue: "1 h 40",
        perDay: "Tasks done per day",
        bestDay: "Best day: Thursday",
        fromClaude: "9 tasks from Claude done",
        topLists: "Most active lists",
        lists: [["Work", 14], ["Personal", 9]],
        days: ["S", "M", "T", "W", "T", "F", "S"],
      },
    },
    outro: { tagline: "Your day, morning to night.", url: "taskly-day.vercel.app", small: "Free · Open source · github.com/ethanfrq/Taskly", disclaimer: "An independent project, not affiliated with Anthropic. Claude is a trademark of Anthropic." },
  },
};

/** One line typed the way you'd say it, and the date, time and priority fall out of it. */
function DayHook({ c }: { c: DayCopy }) {
  const frame = useSceneFrame();
  const { portrait } = useLayout();
  const h = c.hook;
  const typed = progress(frame, 22, 46, (t) => t);
  const chars = Math.round(h.typed.length * typed);
  const cursorOn = frame < 76 && frame % 16 < 9;
  const icons = [IconCalendar, IconClock, IconFlag];
  return (
    <AbsoluteFill style={{ background: colors.bg, justifyContent: "center", alignItems: "center", padding: "0 80px", textAlign: "center" }}>
      <Rise at={4}>
        <Display size={portrait ? 84 : 100}>{h.title}</Display>
      </Rise>
      <Rise at={14} style={{ marginTop: 48, width: "100%", maxWidth: 1000 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: portrait ? "22px 26px" : "24px 32px",
            borderRadius: 999,
            background: colors.card,
            border: "1px solid rgba(255,255,255,0.08)",
            fontFamily: font.text,
            fontSize: portrait ? 34 : 40,
            textAlign: "left",
          }}
        >
          <IconCirclePlus size={portrait ? 36 : 42} stroke={1.8} color={colors.accent} style={{ flex: "none" }} />
          <span style={{ whiteSpace: "nowrap" }}>
            {h.typed.slice(0, chars)}
            <span style={{ display: "inline-block", width: 3, height: portrait ? 36 : 42, background: colors.accent, verticalAlign: -6, marginLeft: 3, opacity: cursorOn ? 1 : 0 }} />
          </span>
        </div>
      </Rise>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 30 }}>
        {h.chips.map((label, i) => {
          const Icon = icons[i];
          return (
            <Rise key={label} at={80 + i * 7} distance={18}>
              <Pill size={30} style={{ color: colors.accent, fontWeight: 600, background: "rgba(10,132,255,0.12)", border: "1px solid rgba(10,132,255,0.35)" }}>
                <Icon size={30} stroke={1.9} />
                {label}
              </Pill>
            </Rise>
          );
        })}
      </div>
      <Rise at={102} style={{ marginTop: 30 }}>
        <Body size={portrait ? 32 : 36}>{h.parsed}</Body>
      </Rise>
    </AbsoluteFill>
  );
}

function DayAgenda({ c }: { c: DayCopy }) {
  const frame = useSceneFrame();
  return (
    <CopyAndPhone title={c.agenda.title} sub={c.agenda.sub}>
      <AgendaScreen title={c.agenda.screenTitle} groups={c.agenda.groups} frame={frame} tabs={c.tabs} />
    </CopyAndPhone>
  );
}

function DayReview({ c }: { c: DayCopy }) {
  const frame = useSceneFrame();
  return (
    <CopyAndPhone title={c.review.title} sub={c.review.sub}>
      <ReviewScreen c={c.review.screen} frame={frame} tabs={c.tabs} done={7} total={9} moveAllAt={70} finishAt={136} />
    </CopyAndPhone>
  );
}

function DayStats({ c }: { c: DayCopy }) {
  const frame = useSceneFrame();
  return (
    <CopyAndPhone title={c.stats.title} sub={c.stats.sub}>
      <StatsScreen c={c.stats.screen} frame={frame} tabs={c.tabs} done={23} completion={82} bars={[2, 4, 3, 5, 4, 3, 2]} />
    </CopyAndPhone>
  );
}

export const DAY: Scene<DayCopy>[] = [
  { component: DayHook, frames: 120 },
  { component: DayAgenda, frames: 150 },
  { component: DayReview, frames: 180 },
  { component: DayStats, frames: 135 },
  { component: Outro, frames: 105 },
];

export function DayFilm({ lang }: { lang: Lang }) {
  return <Film scenes={DAY} c={DAYC[lang]} />;
}
