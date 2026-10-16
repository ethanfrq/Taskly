import type { Recurrence } from "@/lib/tasks/recurrence";
import { addDays, isValidDay, weekdayOf } from "@/lib/time";

/**
 * Natural language task input, in French and English:
 * "Appeler Paul demain 14h #appels @Travail !!" →
 * { title: "Appeler Paul", dueDate: tomorrow, dueTime: "14:00", tags: ["appels"], listName: "Travail", priority: 2 }
 */
export type ParsedTask = {
  title: string;
  /** Undefined when the text names no day. */
  dueDate?: string;
  dueTime?: string;
  priority: number;
  tags: string[];
  listName?: string;
  recurrence?: Recurrence;
};

export type ParseOptions = {
  today: string;
  /** Existing list names: "@name" only matches one of these. */
  lists?: string[];
  /** How to read "10/11": day first (fr) or month first (en). */
  dayFirst?: boolean;
};

const WEEKDAYS: Record<string, number> = {
  dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6,
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6,
};

const MONTHS: Record<string, number> = {
  janvier: 1, février: 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, août: 8, aout: 8,
  septembre: 9, octobre: 10, novembre: 11, décembre: 12, decembre: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9,
  october: 10, november: 11, december: 12,
  janv: 1, févr: 2, fevr: 2, avr: 4, juil: 7, sept: 9, oct: 10, nov: 11, déc: 12, dec: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9,
};

const WEEKDAY_WORDS = Object.keys(WEEKDAYS).sort((a, b) => b.length - a.length).join("|");
const MONTH_WORDS = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join("|");
const NUMBER_WORDS: Record<string, number> = { un: 1, une: 1, a: 1, an: 1, one: 1, deux: 2, two: 2, trois: 3, three: 3 };

// Word boundaries that understand accented letters.
// Hyphens, @, # and "word.word" count as part of a word: "demain-matin", "Lundi.com".
const B = "(?<![\\p{L}\\p{N}_@#./-])";
const E = "(?![\\p{L}\\p{N}_-]|\\.[\\p{L}\\p{N}])";
const re = (source: string) => new RegExp(`${B}(?:${source})${E}`, "iu");

const pad = (n: number) => String(n).padStart(2, "0");

function nextWeekday(today: string, weekday: number, strictlyAfter = true): string {
  for (let i = strictlyAfter ? 1 : 0; i <= 7; i++) {
    const day = addDays(today, i);
    if (weekdayOf(day) === weekday) return day;
  }
  return today;
}

function dateFromParts(today: string, day: number, month: number, year?: number): string | undefined {
  const thisYear = Number(today.slice(0, 4));
  const fullYear = year === undefined ? thisYear : year < 100 ? 2000 + year : year;
  let candidate = `${fullYear}-${pad(month)}-${pad(day)}`;
  if (!isValidDay(candidate)) return undefined;
  if (year === undefined && candidate < today) candidate = `${fullYear + 1}-${pad(month)}-${pad(day)}`;
  return isValidDay(candidate) ? candidate : undefined;
}

function time24(hour: number, minute: number, meridiem?: string): string | undefined {
  let h = hour;
  if (meridiem) {
    const pm = meridiem.toLowerCase().startsWith("p");
    if (h < 1 || h > 12) return undefined;
    if (pm && h !== 12) h += 12;
    if (!pm && h === 12) h = 0;
  }
  if (h > 23 || minute > 59) return undefined;
  return `${pad(h)}:${pad(minute)}`;
}

type Rule = {
  pattern: RegExp;
  apply: (m: RegExpMatchArray, state: ParsedTask, opts: ParseOptions) => boolean;
};

const RULES: Rule[] = [
  // Priority: !, !!, !!!
  {
    pattern: /(?<=^|\s)(!{1,3})(?=\s|$)/u,
    apply: (m, s) => ((s.priority = m[1].length), true),
  },
  // #tag
  {
    pattern: /(?<=^|\s)#([\p{L}\p{N}_-]+)/u,
    apply: (m, s) => (s.tags.push(m[1].toLowerCase()), true),
  },
  // @list (existing lists only)
  {
    pattern: /(?<=^|\s)@([\p{L}\p{N}_-]+)/u,
    apply: (m, s, o) => {
      const match = o.lists?.find((name) => name.toLowerCase().replace(/\s+/g, "") === m[1].toLowerCase());
      if (!match) return false;
      s.listName = match;
      return true;
    },
  },
  // Recurrence on a given weekday: "tous les lundis", "chaque lundi", "every monday", "mondays"
  {
    pattern: re(`(?:tous les|chaque|every|each)\\s+(${WEEKDAY_WORDS})s?|(${WEEKDAY_WORDS})s`),
    apply: (m, s, o) => {
      const weekday = WEEKDAYS[(m[1] ?? m[2]).toLowerCase()];
      if (weekday === undefined) return false;
      s.recurrence = `weekly:${weekday}`;
      s.dueDate ??= nextWeekday(o.today, weekday, false);
      return true;
    },
  },
  {
    pattern: re("tous les jours|chaque jour|quotidiennement|every ?day|daily"),
    apply: (_, s) => ((s.recurrence = "daily"), true),
  },
  {
    pattern: re("en semaine|jours ouvr[ée]s|every weekday|weekdays"),
    apply: (_, s) => ((s.recurrence = "weekdays"), true),
  },
  {
    pattern: re("toutes les semaines|chaque semaine|every week|weekly"),
    apply: (_, s) => ((s.recurrence = "weekly"), true),
  },
  {
    pattern: re("tous les mois|chaque mois|every month|monthly"),
    apply: (_, s) => ((s.recurrence = "monthly"), true),
  },
  // Relative days
  {
    pattern: re("après-demain|apres-demain|apres demain|après demain|day after tomorrow"),
    apply: (_, s, o) => ((s.dueDate = addDays(o.today, 2)), true),
  },
  {
    pattern: re("demain|tomorrow|tmrw"),
    apply: (_, s, o) => ((s.dueDate = addDays(o.today, 1)), true),
  },
  {
    pattern: re("ce soir|tonight"),
    apply: (_, s, o) => {
      s.dueDate = o.today;
      s.dueTime ??= "19:00";
      return true;
    },
  },
  {
    pattern: re("ce matin|this morning"),
    apply: (_, s, o) => {
      s.dueDate = o.today;
      s.dueTime ??= "09:00";
      return true;
    },
  },
  {
    pattern: re("aujourd['’]hui|auj|today"),
    apply: (_, s, o) => ((s.dueDate = o.today), true),
  },
  {
    pattern: re("(?:dans|in)\\s+(\\d{1,3}|un|une|deux|trois|a|an|one|two|three)\\s+(jours?|days?|semaines?|weeks?)"),
    apply: (m, s, o) => {
      const n = Number(m[1]) || NUMBER_WORDS[m[1].toLowerCase()];
      const weeks = /^(semaine|week)/i.test(m[2]);
      s.dueDate = addDays(o.today, weeks ? n * 7 : n);
      return true;
    },
  },
  {
    pattern: re("la semaine prochaine|semaine prochaine|next week"),
    apply: (_, s, o) => ((s.dueDate = nextWeekday(o.today, 1)), true),
  },
  // Weekdays: "lundi", "lundi prochain", "next monday", "on monday"
  {
    pattern: re(`(?:on\\s+|next\\s+)?(${WEEKDAY_WORDS})(?:\\s+prochain)?`),
    apply: (m, s, o) => {
      const weekday = WEEKDAYS[m[1].toLowerCase()];
      if (weekday === undefined) return false;
      s.dueDate = nextWeekday(o.today, weekday);
      return true;
    },
  },
  // "15 octobre", "15 oct 2027", "le 15 octobre"
  {
    pattern: re(`(?:le\\s+)?(\\d{1,2})(?:er)?\\s+(${MONTH_WORDS})\\.?(?:\\s+(\\d{4}))?`),
    apply: (m, s, o) => {
      const date = dateFromParts(o.today, Number(m[1]), MONTHS[m[2].toLowerCase()], m[3] ? Number(m[3]) : undefined);
      if (!date) return false;
      s.dueDate = date;
      return true;
    },
  },
  // "October 15", "oct 15th", "on October 15 2027"
  {
    pattern: re(`(?:on\\s+)?(${MONTH_WORDS})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?`),
    apply: (m, s, o) => {
      const date = dateFromParts(o.today, Number(m[2]), MONTHS[m[1].toLowerCase()], m[3] ? Number(m[3]) : undefined);
      if (!date) return false;
      s.dueDate = date;
      return true;
    },
  },
  // "15/10", "15/10/2027" (day first in French, month first in English)
  {
    pattern: re("(?:le\\s+|on\\s+)?(\\d{1,2})/(\\d{1,2})(?:/(\\d{2,4}))?"),
    apply: (m, s, o) => {
      const [a, b] = [Number(m[1]), Number(m[2])];
      const [day, month] = o.dayFirst === false ? [b, a] : [a, b];
      const date = dateFromParts(o.today, day, month, m[3] ? Number(m[3]) : undefined);
      if (!date) return false;
      s.dueDate = date;
      return true;
    },
  },
  // "le 15" (this month, or next month if already past)
  {
    pattern: re("le\\s+(\\d{1,2})(?:er)?"),
    apply: (m, s, o) => {
      const day = Number(m[1]);
      let [year, month] = o.today.split("-").map(Number);
      let date = dateFromParts(o.today, day, month, year);
      if (!date || date < o.today) {
        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
        date = dateFromParts(o.today, day, month, year);
      }
      if (!date) return false;
      s.dueDate = date;
      return true;
    },
  },
  // Noon and midnight
  {
    pattern: re("(?:à\\s+|a\\s+|at\\s+|vers\\s+)?(midi|noon|minuit|midnight)"),
    apply: (m, s) => ((s.dueTime = /midi|noon/i.test(m[1]) ? "12:00" : "00:00"), true),
  },
  // "2pm", "2:30 pm", "at 9am"
  {
    pattern: re("(?:at\\s+|à\\s+|vers\\s+)?(\\d{1,2})(?::(\\d{2}))?\\s?(am|pm|a\\.m\\.|p\\.m\\.)"),
    apply: (m, s) => {
      const time = time24(Number(m[1]), Number(m[2] ?? 0), m[3]);
      if (!time) return false;
      s.dueTime = time;
      return true;
    },
  },
  // "14h", "14h30", "14 h 30", "à 9h"
  {
    pattern: re("(?:à\\s+|a\\s+|vers\\s+|at\\s+)?(\\d{1,2})\\s?h\\s?(\\d{2})?"),
    apply: (m, s) => {
      const time = time24(Number(m[1]), Number(m[2] ?? 0));
      if (!time) return false;
      s.dueTime = time;
      return true;
    },
  },
  // "14:30", "at 14:30"
  {
    pattern: re("(?:à\\s+|a\\s+|vers\\s+|at\\s+)?(\\d{1,2}):(\\d{2})"),
    apply: (m, s) => {
      const time = time24(Number(m[1]), Number(m[2]));
      if (!time) return false;
      s.dueTime = time;
      return true;
    },
  },
];

export function parseTask(input: string, options: ParseOptions): ParsedTask {
  const state: ParsedTask = { title: "", priority: 0, tags: [] };
  let text = ` ${input} `;

  for (const rule of RULES) {
    const global = new RegExp(rule.pattern.source, rule.pattern.flags.includes("g") ? rule.pattern.flags : `${rule.pattern.flags}g`);
    text = text.replace(global, (...args: unknown[]) => {
      // replace() passes the match and its groups, then the offset (a number).
      const groups = args.slice(0, args.findIndex((a) => typeof a === "number")) as string[];
      return rule.apply(groups as unknown as RegExpMatchArray, state, options) ? " " : groups[0];
    });
  }

  if (state.dueTime && !state.dueDate) state.dueDate = options.today;
  state.title = text
    .replace(/\s+/g, " ")
    // Prepositions left hanging at the end: "Appeler Paul le", "Call Paul on"
    .replace(/\s+(?:le|la|à|a|pour|vers|on|at|by|for)\s*$/iu, "")
    .trim();
  state.tags = [...new Set(state.tags)];
  return state;
}
