"use client";

import { IconPlayerPause, IconPlayerPlay, IconPlayerStop } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/format";
import { recordFocusAction, toggleTaskAction } from "../actions";

const DURATIONS = [15, 25, 50];
const STORAGE_KEY = "taskly:focus";

type Saved = { taskId: string | null; minutes: number; endsAt: number | null; remaining: number | null };

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function save(value: Saved | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode: the timer still works, it just won't survive a reload.
  }
}

function chime() {
  try {
    const audio = new AudioContext();
    for (const [i, freq] of [660, 880, 990].entries()) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, audio.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + i * 0.18 + 0.5);
      osc.connect(gain).connect(audio.destination);
      osc.start(audio.currentTime + i * 0.18);
      osc.stop(audio.currentTime + i * 0.18 + 0.5);
    }
  } catch {
    // No audio available.
  }
}

const mmss = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/** A Pomodoro timer that survives reloads (the end time is stored, not a countdown). */
export function FocusTimer({ tasks, initialTaskId }: { tasks: { id: string; title: string }[]; initialTaskId: string | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const [taskId, setTaskId] = useState<string | null>(initialTaskId);
  const [minutes, setMinutes] = useState(25);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const saved = load();
    if (!saved) return;
    // Restore after a reload, outside of render.
    queueMicrotask(() => {
      setTaskId(saved.taskId ?? initialTaskId);
      setMinutes(saved.minutes);
      setEndsAt(saved.endsAt);
      setRemaining(saved.remaining);
    });
  }, [initialTaskId]);

  useEffect(() => {
    if (!endsAt) return;
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(tick);
  }, [endsAt]);

  const left = endsAt ? endsAt - now : (remaining ?? minutes * 60_000);

  useEffect(() => {
    if (!endsAt || endsAt > now) return;
    queueMicrotask(() => {
      setEndsAt(null);
      setRemaining(null);
      setFinished(true);
      save(null);
    });
    chime();
    startTransition(() => recordFocusAction(minutes, taskId));
    if (document.hidden && "serviceWorker" in navigator && Notification.permission === "granted") {
      navigator.serviceWorker.ready
        .then((reg) => reg.showNotification(t.focus.notification, { body: format(t.focus.doneBody, { minutes }), tag: "focus" }))
        .catch(() => undefined);
    }
  }, [endsAt, now, minutes, taskId, t]);

  const start = () => {
    const end = Date.now() + (remaining ?? minutes * 60_000);
    setFinished(false);
    setEndsAt(end);
    setRemaining(null);
    setNow(Date.now());
    save({ taskId, minutes, endsAt: end, remaining: null });
  };
  const pause = () => {
    const rest = (endsAt ?? Date.now()) - Date.now();
    setEndsAt(null);
    setRemaining(rest);
    save({ taskId, minutes, endsAt: null, remaining: rest });
  };
  const stop = () => {
    setEndsAt(null);
    setRemaining(null);
    save(null);
  };

  const running = endsAt !== null;
  const idle = !running && remaining === null;
  const progress = 1 - left / (minutes * 60_000);
  const circumference = 2 * Math.PI * 45;
  const task = tasks.find((x) => x.id === taskId);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6">
      <h1 className="self-start text-[34px] font-bold tracking-tight">{t.focus.title}</h1>

      {idle && !finished ? (
        <div className="flex w-full flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="px-1 text-[13px] text-text-secondary">{t.focus.pick}</span>
            <select
              value={taskId ?? ""}
              onChange={(e) => setTaskId(e.target.value || null)}
              className="rounded-xl bg-card px-4 py-3 text-[16px]"
            >
              <option value="">{t.focus.noTask}</option>
              {tasks.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
            </select>
          </label>
          <div role="radiogroup" aria-label={t.focus.durations} className="flex rounded-[9px] bg-fill p-0.5">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={minutes === d}
                onClick={() => setMinutes(d)}
                className="flex-1 rounded-[7px] py-1.5 text-[14px] aria-checked:bg-card aria-checked:font-semibold"
              >
                {format(t.focus.minutes, { count: d })}
              </button>
            ))}
          </div>
        </div>
      ) : task ? (
        <p className="text-center text-[17px] font-medium">{task.title}</p>
      ) : null}

      <div className="relative my-2 size-64" role="timer" aria-live="off" aria-label={mmss(left)}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--separator)" strokeWidth="5" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeOpacity={progress > 0.001 ? 1 : 0}
            strokeDasharray={`${circumference * Math.min(Math.max(progress, 0), 1)} ${circumference}`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[56px] font-light tabular-nums">
          {finished ? "00:00" : mmss(left)}
        </span>
      </div>

      {finished ? (
        <div className="flex w-full flex-col gap-2 text-center">
          <p className="text-[22px] font-bold">{t.focus.doneTitle}</p>
          <p className="text-[15px] text-text-secondary">{format(t.focus.doneBody, { minutes })}</p>
          {task ? (
            <Button
              onClick={() =>
                startTransition(async () => {
                  await toggleTaskAction(task.id, true);
                  router.push("/today");
                })
              }
            >
              {t.focus.markDone}
            </Button>
          ) : null}
          <Button variant="plain" onClick={() => setFinished(false)}>
            {t.focus.again}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          {!idle ? (
            <button type="button" onClick={stop} aria-label={t.focus.reset} className="flex size-14 items-center justify-center rounded-full bg-card text-text-secondary">
              <IconPlayerStop size={24} stroke={1.8} aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            onClick={running ? pause : start}
            aria-label={running ? t.focus.pause : idle ? t.focus.start : t.focus.resume}
            className="flex size-20 items-center justify-center rounded-full bg-accent text-on-accent"
          >
            {running ? <IconPlayerPause size={34} stroke={1.8} aria-hidden /> : <IconPlayerPlay size={34} stroke={1.8} aria-hidden />}
          </button>
        </div>
      )}
    </div>
  );
}
