import { IconArrowBackUp, IconCheck, IconDownload, IconSparkles, IconUnlink } from "@tabler/icons-react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { Monogram } from "../brand/Logo";
import { copy as promo, type Lang, type OutroCopy, type SourceKind } from "../copy";
import { Film, type Scene } from "../film";
import { progress, Rise, useLayout, useSceneFrame } from "../motion";
import { Outro } from "../scenes/Outro";
import { colors, font } from "../theme";
import { CopyAndPhone } from "../ui/layout";
import { ClaudeScreen, type ClaudeCopy } from "../ui/screens/ClaudeScreen";
import { SourceIcon } from "../ui/SourceIcon";
import { Body, Display, Pill } from "../ui/text";

export type PrivCopy = {
  tabs: string[];
  hook: { q: string; a1: string; a2: string };
  flow: {
    title: string;
    title2: string;
    sources: { kind: SourceKind; label: string }[];
    claude: string;
    claudeSub: string;
    arrow: string;
    taskly: string;
    tasklySub: string;
    packet: string;
    pills: string[];
  };
  control: { title: string; sub: string; chips: string[]; screen: ClaudeCopy };
  outro: OutroCopy;
};

export const PRIV: Record<Lang, PrivCopy> = {
  fr: {
    tabs: promo.fr.phone.tabs,
    hook: { q: "Qui lit tes mails ?", a1: "Claude, avec tes connecteurs.", a2: "Pas Taskly. Jamais." },
    flow: {
      title: "Claude lit. Taskly reçoit des tâches.",
      title2: "Tes mails restent dans ta boîte. Taskly ne reçoit que ce que Claude crée, avec un lien vers la source.",
      sources: [
        { kind: "gmail", label: "Gmail" },
        { kind: "calendar", label: "Agenda" },
        { kind: "slack", label: "Slack" },
      ],
      claude: "Claude",
      claudeSub: "Ton plan, tes connecteurs",
      arrow: "MCP · OAuth 2.1",
      taskly: "Taskly",
      tasklySub: "Tes tâches, rien d'autre",
      packet: "Envoyer le devis à Dupont",
      pills: ["Pas de clé API", "Pas de facture IA", "Un lien vers la source"],
    },
    control: {
      title: "Tu gardes la main.",
      sub: "Un geste annule ce que Claude a ajouté. Un autre le déconnecte, et ses jetons meurent à l'instant.",
      chips: ["Annuler en un geste", "Déconnexion immédiate", "Export ou suppression"],
      screen: {
        title: "Connecter Claude",
        connected: "Claude est connecté",
        connectedSince: "Depuis le 12 octobre · lecture et écriture des tâches",
        urlLabel: "Adresse du connecteur",
        url: "https://ton-taskly.vercel.app/api/mcp",
        copy: "Copier",
        morningTip: "Chaque matin, demande à Claude : « Prépare ma journée dans Taskly ».",
        disconnect: "Déconnecter Claude",
        disconnectHint: "Claude perd l'accès à Taskly tout de suite. Tes tâches restent là.",
        dialogTitle: "Déconnecter Claude ?",
        dialogBody: "Claude ne pourra plus lire ni ajouter de tâches. Pour le reconnecter, ajoute à nouveau Taskly dans ses connecteurs.",
        cancel: "Annuler",
        confirm: "Déconnecter",
        disconnected: "Claude n'est pas connecté",
        disconnectedHint: "Jetons révoqués. Tes tâches sont toujours là.",
        connect: "Connecter Claude",
      },
    },
    outro: { tagline: "Des tâches, pas des mails.", url: "taskly-day.vercel.app", small: "Open source · MIT · github.com/ethanfrq/Taskly", disclaimer: "Projet indépendant, non affilié à Anthropic. Claude est une marque d'Anthropic." },
  },
  en: {
    tabs: promo.en.phone.tabs,
    hook: { q: "Who reads your email?", a1: "Claude, with your connectors.", a2: "Not Taskly. Ever." },
    flow: {
      title: "Claude reads. Taskly gets tasks.",
      title2: "Your mail stays in your inbox. Taskly only receives what Claude creates, with a link back to the source.",
      sources: [
        { kind: "gmail", label: "Gmail" },
        { kind: "calendar", label: "Calendar" },
        { kind: "slack", label: "Slack" },
      ],
      claude: "Claude",
      claudeSub: "Your plan, your connectors",
      arrow: "MCP · OAuth 2.1",
      taskly: "Taskly",
      tasklySub: "Your tasks, nothing else",
      packet: "Send the quote to Dupont",
      pills: ["No API key", "No AI bill", "A link to the source"],
    },
    control: {
      title: "You stay in control.",
      sub: "One tap undoes what Claude added. Another disconnects it, and its tokens die on the spot.",
      chips: ["Undo in one tap", "Instant disconnect", "Export or delete"],
      screen: {
        title: "Connect Claude",
        connected: "Claude is connected",
        connectedSince: "Since October 12 · reads and writes tasks",
        urlLabel: "Connector address",
        url: "https://your-taskly.vercel.app/api/mcp",
        copy: "Copy",
        morningTip: "Each morning, ask Claude: “Prepare my day in Taskly”.",
        disconnect: "Disconnect Claude",
        disconnectHint: "Claude loses access to Taskly right away. Your tasks stay.",
        dialogTitle: "Disconnect Claude?",
        dialogBody: "Claude won't be able to read or add tasks anymore. To reconnect, add Taskly to its connectors again.",
        cancel: "Cancel",
        confirm: "Disconnect",
        disconnected: "Claude isn't connected",
        disconnectedHint: "Tokens revoked. Your tasks are still here.",
        connect: "Connect Claude",
      },
    },
    outro: { tagline: "Tasks, not emails.", url: "taskly-day.vercel.app", small: "Open source · MIT · github.com/ethanfrq/Taskly", disclaimer: "An independent project, not affiliated with Anthropic. Claude is a trademark of Anthropic." },
  },
};

function PrivHook({ c }: { c: PrivCopy }) {
  const { portrait } = useLayout();
  return (
    <AbsoluteFill style={{ background: colors.bg, justifyContent: "center", alignItems: "center", padding: "0 80px", textAlign: "center" }}>
      <Rise at={4}>
        <Display size={portrait ? 96 : 124}>{c.hook.q}</Display>
      </Rise>
      <Rise at={38} style={{ marginTop: 36 }}>
        <Display size={portrait ? 60 : 72} style={{ color: colors.textSecondary, fontWeight: 600 }}>
          {c.hook.a1}
        </Display>
      </Rise>
      <Rise at={66} style={{ marginTop: 14 }}>
        <Display size={portrait ? 60 : 72} style={{ color: colors.accent, fontWeight: 600 }}>
          {c.hook.a2}
        </Display>
      </Rise>
    </AbsoluteFill>
  );
}

type Pt = { x: number; y: number };
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Sources, Claude, Taskly: mail flows into Claude, only tasks flow on to Taskly. */
function PrivFlow({ c }: { c: PrivCopy }) {
  const frame = useSceneFrame();
  const { width, height, portrait } = useLayout();
  const f = c.flow;
  const node = portrait ? 190 : 210;
  const src = portrait ? { w: 280, h: 96 } : { w: 300, h: 110 };
  const g = portrait
    ? {
        sources: f.sources.map((_, i) => ({ x: 200 + i * 340, y: 620 })),
        claude: { x: 540, y: 1010 },
        taskly: { x: 540, y: 1430 },
        label: { x: 540 + 150, y: 1220 },
        titleTop: 150,
        pillsTop: 1660,
      }
    : {
        sources: f.sources.map((_, i) => ({ x: 360, y: 400 + i * 180 })),
        claude: { x: 960, y: 580 },
        taskly: { x: 1580, y: 580 },
        label: { x: 1270, y: 500 },
        titleTop: 110,
        pillsTop: 950,
      };
  const srcOut = (p: Pt): Pt => (portrait ? { x: p.x, y: p.y + src.h / 2 } : { x: p.x + src.w / 2, y: p.y });
  const claudeIn: Pt = portrait ? { x: g.claude.x, y: g.claude.y - node / 2 } : { x: g.claude.x - node / 2, y: g.claude.y };
  const claudeOut: Pt = portrait ? { x: g.claude.x, y: g.claude.y + node / 2 } : { x: g.claude.x + node / 2, y: g.claude.y };
  const tasklyIn: Pt = portrait ? { x: g.taskly.x, y: g.taskly.y - node / 2 } : { x: g.taskly.x - node / 2, y: g.taskly.y };
  const draw = (at: number) => progress(frame, at, 30, Easing.out(Easing.cubic));

  const travel = (from: Pt, to: Pt, start: number, every: number, duration: number, render: (p: Pt, k: number) => React.ReactNode) => {
    const out: React.ReactNode[] = [];
    for (let k = 0; k < 8; k++) {
      const t = (frame - start - k * every) / duration;
      if (t <= 0 || t >= 1) continue;
      const p = lerp(from, to, Easing.inOut(Easing.quad)(t));
      out.push(<div key={k} style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%, -50%)", opacity: Math.sin(Math.PI * t) }}>{render(p, k)}</div>);
    }
    return out;
  };

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <div style={{ position: "absolute", top: g.titleTop, left: 80, right: 80, textAlign: "center" }}>
        <Rise at={4}>
          <Display size={portrait ? 60 : 66}>{f.title}</Display>
        </Rise>
        <Rise at={30} style={{ marginTop: 18, maxWidth: 1100, marginInline: "auto" }}>
          <Body size={portrait ? 32 : 34}>{f.title2}</Body>
        </Rise>
      </div>

      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {g.sources.map((p, i) => {
          const a = srcOut(p);
          return <line key={i} x1={a.x} y1={a.y} x2={claudeIn.x} y2={claudeIn.y} stroke="rgba(255,255,255,0.22)" strokeWidth={3} strokeDasharray="1" strokeDashoffset={1 - draw(40 + i * 6)} pathLength={1} />;
        })}
        <line x1={claudeOut.x} y1={claudeOut.y} x2={tasklyIn.x} y2={tasklyIn.y} stroke={colors.accent} strokeWidth={4} strokeDasharray="1" strokeDashoffset={1 - draw(70)} pathLength={1} />
      </svg>

      {g.sources.map((p, i) => (
        <Rise key={f.sources[i].kind} at={10 + i * 6} style={{ position: "absolute", left: p.x - src.w / 2, top: p.y - src.h / 2 }}>
          <div style={{ width: src.w, height: src.h, borderRadius: 22, background: colors.card, border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 16, padding: "0 24px", fontSize: 28, fontWeight: 600 }}>
            <span style={{ width: 52, height: 52, borderRadius: 14, background: colors.fill, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <SourceIcon kind={f.sources[i].kind} size={28} stroke={1.7} />
            </span>
            {f.sources[i].label}
          </div>
        </Rise>
      ))}

      <Rise at={30} style={{ position: "absolute", left: g.claude.x - node / 2, top: g.claude.y - node / 2, width: node, textAlign: "center" }}>
        <div style={{ width: node, height: node, borderRadius: 999, background: colors.card, border: `3px solid ${colors.accent}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 80px rgba(10,132,255,0.25)" }}>
          <IconSparkles size={node * 0.42} stroke={1.5} color={colors.text} />
        </div>
        <div style={{ marginTop: 16, fontFamily: font.display, fontSize: 34, fontWeight: 700 }}>{f.claude}</div>
        <div style={{ fontSize: 20, color: colors.textSecondary, whiteSpace: "nowrap" }}>{f.claudeSub}</div>
      </Rise>

      <Rise at={44} style={{ position: "absolute", left: g.taskly.x - node / 2, top: g.taskly.y - node / 2, width: node, textAlign: "center" }}>
        <div style={{ width: node, height: node, borderRadius: 48, background: colors.graphite, color: colors.ivory, border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Monogram style={{ width: node * 0.5, height: node * 0.5 }} />
        </div>
        <div style={{ marginTop: 16, fontFamily: font.display, fontSize: 34, fontWeight: 700 }}>{f.taskly}</div>
        <div style={{ fontSize: 20, color: colors.textSecondary, whiteSpace: "nowrap" }}>{f.tasklySub}</div>
      </Rise>

      <Rise at={80} style={{ position: "absolute", left: g.label.x, top: g.label.y, transform: "translate(-50%, -50%)" }}>
        <Pill size={22} style={{ color: colors.accent, fontWeight: 600, background: "rgba(10,132,255,0.12)", border: "1px solid rgba(10,132,255,0.35)" }}>
          {f.arrow}
        </Pill>
      </Rise>

      {g.sources.map((p, i) =>
        travel(srcOut(p), claudeIn, 60 + i * 22, 64, 44, () => (
          <span style={{ width: 44, height: 44, borderRadius: 999, background: colors.fill, border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: colors.text }}>
            <SourceIcon kind={f.sources[i].kind} size={22} stroke={1.7} />
          </span>
        )),
      )}
      {travel(claudeOut, tasklyIn, 95, 70, 48, () => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 999, background: colors.accent, color: colors.onAccent, fontSize: 18, fontWeight: 600, whiteSpace: "nowrap", boxShadow: "0 10px 30px rgba(10,132,255,0.35)" }}>
          <IconCheck size={18} stroke={3} />
          {f.packet}
        </span>
      ))}

      <div style={{ position: "absolute", top: g.pillsTop, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
        {f.pills.map((label, i) => (
          <Rise key={label} at={130 + i * 8} distance={20}>
            <Pill size={28} style={{ fontWeight: 600 }}>
              {label}
            </Pill>
          </Rise>
        ))}
      </div>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: interpolate(frame, [0, 1], [0, 0]) }} />
    </AbsoluteFill>
  );
}

function PrivControl({ c }: { c: PrivCopy }) {
  const frame = useSceneFrame();
  const k = c.control;
  const icons = [IconArrowBackUp, IconUnlink, IconDownload];
  return (
    <CopyAndPhone
      title={k.title}
      sub={k.sub}
      chips={k.chips.map((label, i) => {
        const Icon = icons[i];
        return (
          <>
            <Icon size={26} stroke={1.8} color={colors.accent} />
            {label}
          </>
        );
      })}
    >
      <ClaudeScreen c={k.screen} frame={frame} tabs={c.tabs} tapAt={64} confirmAt={124} />
    </CopyAndPhone>
  );
}

export const PRIVACY: Scene<PrivCopy>[] = [
  { component: PrivHook, frames: 105 },
  { component: PrivFlow, frames: 225 },
  { component: PrivControl, frames: 195 },
  { component: Outro, frames: 105 },
];

export function PrivacyFilm({ lang }: { lang: Lang }) {
  return <Film scenes={PRIVACY} c={PRIV[lang]} />;
}
