import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { isRecurrence } from "@/lib/tasks/recurrence";
import { SOURCE_KINDS } from "@/lib/tasks/sources";
import { isValidDay, isValidTime } from "@/lib/time";
import * as h from "./handlers";

const day = z.string().refine(isValidDay, "Expected YYYY-MM-DD");
const time = z.string().refine(isValidTime, "Expected HH:MM, 24-hour");
const sourceKind = z.enum(SOURCE_KINDS);

export const INSTRUCTIONS = `Taskly is the user's daily to-do list with reminders. Dates are YYYY-MM-DD and times HH:MM (24h) in the user's time zone, which get_today returns.

When the user asks to prepare their day (for example "Prepare my day in Taskly", "Prépare ma journée dans Taskly"):
1. Call get_today to see what is already planned.
2. Refresh the tasks you added earlier (see below).
3. Read today's events from all of the user's calendar connectors and save them with add_calendar_events: pass each calendar event id as "id", and today's date as replace_day so meetings cancelled since last time disappear. Leave replace_day out if you could not read every calendar.
4. Read recent unread or important emails and messages from the user's connectors. For each one that needs an action from the user, create ONE short, actionable task with add_tasks: start with a verb ("Reply to Sarah about the Q4 plan"), set source.kind and source.url (link to the email or message) so the user can open it. Use due_time only when the source names a time. Use priority 3 only for real urgency.
5. Never create tasks for newsletters, notifications, receipts or things already done. Taskly skips duplicates, so running this twice is safe.
6. Finish with a two-sentence summary of the day, including what you changed.

When the user asks to refresh or update their tasks (for example "Refresh my day in Taskly", "Actualise ma journée dans Taskly"), or as step 2 above:
1. Call get_claude_tasks: the open tasks you created, with their source links.
2. Re-read each task's source. Only act when the source shows something new: the user already replied or did it (complete), a date, time or detail changed (update), or it no longer applies, e.g. the meeting was cancelled (remove).
3. Send all of it in one refresh_tasks call, each with a short reason in the user's language ("Sarah a répondu", "Réunion déplacée à 15h"). Never change a task just to reword it, and leave tasks marked edited_by_user alone: the user's version wins.
4. Add new tasks with add_tasks and refresh today's events with add_calendar_events as in "prepare my day".
5. Tell the user in one or two sentences what changed. Taskly shows it with your reasons and lets them undo it.

When the user says a meeting was cancelled, remove it with remove_calendar_events (ids from get_today).

When the user says "Taskly, check my connections", call report_connections with the connectors you can actually use right now.`;

const json = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  structuredContent: value as Record<string, unknown>,
});

/** One MCP server instance per request, bound to the signed-in user. */
export function createTasklyServer(ctx: h.McpContext): McpServer {
  const server = new McpServer({ name: "taskly", version: "0.1.0" }, { instructions: INSTRUCTIONS });

  const touched = async <T>(fn: () => Promise<T>) => {
    const result = await fn();
    await h.touchClaude(ctx);
    return json(result);
  };

  server.registerTool(
    "get_today",
    {
      title: "Get today",
      description: "The user's day: today's date and time zone, overdue and open tasks, tasks done today, and today's calendar events.",
      annotations: { readOnlyHint: true },
    },
    async () => touched(() => h.getToday(ctx)),
  );

  server.registerTool(
    "get_upcoming",
    {
      title: "Get upcoming tasks",
      description: "Open tasks planned after today, up to the given number of days ahead.",
      inputSchema: z.object({ days: z.number().int().min(1).max(31).default(7) }),
      annotations: { readOnlyHint: true },
    },
    async ({ days }) => touched(() => h.getUpcoming(ctx, days)),
  );

  server.registerTool(
    "add_tasks",
    {
      title: "Add tasks",
      description:
        "Adds actionable tasks to the user's day, usually from emails, messages or calendar items. Always set source.kind, and source.url when you have a link. Tasks already in Taskly are skipped. The user can undo the whole batch from the Today screen.",
      inputSchema: z.object({
        tasks: z
          .array(
            z.object({
              title: z.string().trim().min(1).max(300).describe("Short and actionable, starting with a verb"),
              notes: z.string().max(2000).optional(),
              due_date: day.optional().describe("Defaults to today"),
              due_time: time.optional().describe("Only when the source names a time"),
              priority: z.number().int().min(0).max(3).optional().describe("0 none, 1 low, 2 medium, 3 high"),
              list: z.string().max(80).optional().describe("Name of one of the user's lists, see list_lists"),
              tags: z.array(z.string().max(40)).max(10).optional(),
              recurrence: z.string().refine(isRecurrence).optional().describe('"daily", "weekdays", "weekly", "weekly:1,3", "monthly"'),
              source: z
                .object({
                  kind: sourceKind,
                  url: z.url().max(2048).optional(),
                  label: z.string().max(120).optional().describe('e.g. "Email from Sarah"'),
                })
                .optional(),
            }),
          )
          .min(1)
          .max(25),
      }),
    },
    async ({ tasks }) => touched(() => h.addTasks(ctx, tasks)),
  );

  server.registerTool(
    "complete_task",
    {
      title: "Complete a task",
      description: "Checks a task off. Recurring tasks get their next occurrence.",
      inputSchema: z.object({ task_id: z.string().min(1).max(64) }),
      annotations: { idempotentHint: true },
    },
    async ({ task_id }) => touched(() => h.completeTask(ctx, task_id)),
  );

  server.registerTool(
    "update_task",
    {
      title: "Update a task",
      description: "Changes a task's title, notes, day, time or priority.",
      inputSchema: z.object({
        task_id: z.string().min(1).max(64),
        title: z.string().trim().min(1).max(300).optional(),
        notes: z.string().max(2000).optional(),
        due_date: day.nullable().optional(),
        due_time: time.nullable().optional(),
        priority: z.number().int().min(0).max(3).optional(),
      }),
      annotations: { idempotentHint: true },
    },
    async ({ task_id, ...patch }) => touched(() => h.editTask(ctx, task_id, patch)),
  );

  server.registerTool(
    "get_claude_tasks",
    {
      title: "Get the tasks Claude added",
      description:
        "The open tasks you created from the user's sources, any date, with their source links: what to re-check when refreshing. Tasks with edited_by_user: true were changed by the user; leave them alone.",
      annotations: { readOnlyHint: true },
    },
    async () => touched(() => h.getClaudeTasks(ctx)),
  );

  server.registerTool(
    "refresh_tasks",
    {
      title: "Refresh tasks",
      description:
        "Applies what changed in the sources of tasks you created: update (new day, time, title, notes or priority), complete (the source shows it's done, e.g. the user already replied), remove (no longer relevant, e.g. the meeting was cancelled). Each change needs a short reason the user will see; they can undo the whole refresh. Tasks the user created or edited are skipped and reported back.",
      inputSchema: z.object({
        changes: z
          .array(
            z.object({
              task_id: z.string().min(1).max(64),
              action: z.enum(["update", "complete", "remove"]),
              reason: z.string().trim().min(3).max(140).describe("Shown to the user, in their language: \"Sarah a répondu\""),
              title: z.string().trim().min(1).max(300).optional(),
              notes: z.string().max(2000).optional(),
              due_date: day.nullable().optional(),
              due_time: time.nullable().optional(),
              priority: z.number().int().min(0).max(3).optional(),
            }),
          )
          .min(1)
          .max(50),
      }),
      annotations: { destructiveHint: true },
    },
    async ({ changes }) => touched(() => h.refreshTasks(ctx, changes)),
  );

  server.registerTool(
    "list_lists",
    {
      title: "List lists",
      description: "The user's task lists, to file tasks with add_tasks.",
      annotations: { readOnlyHint: true },
    },
    async () => touched(() => h.listLists(ctx)),
  );

  server.registerTool(
    "add_calendar_events",
    {
      title: "Add calendar events",
      description:
        "Copies events from the user's calendars so Taskly can show the day's agenda and the next meeting. Pass the calendar's event id as `id` to avoid duplicates. With `replace_day`, the events are the whole day: the ones Taskly had for that day and you didn't send are removed.",
      inputSchema: z.object({
        replace_day: z.iso
          .date()
          .optional()
          .describe("YYYY-MM-DD. Only when `events` holds every event of that day from all the user's calendars (it may then be empty)."),
        events: z
          .array(
            z.object({
              title: z.string().trim().min(1).max(300),
              start: z.iso.datetime({ offset: true }).describe("ISO 8601 with offset, e.g. 2026-10-16T14:00:00+02:00"),
              end: z.iso.datetime({ offset: true }).optional(),
              all_day: z.boolean().optional(),
              location: z.string().max(300).optional(),
              url: z.url().max(2048).optional(),
              id: z.string().max(256).optional(),
              kind: sourceKind.optional(),
            }),
          )
          .max(50),
      }),
      annotations: { idempotentHint: true },
    },
    async ({ events, replace_day }) => touched(() => h.addEvents(ctx, events, replace_day)),
  );

  server.registerTool(
    "remove_calendar_events",
    {
      title: "Remove calendar events",
      description: "Removes events from Taskly's agenda, for example a meeting the user says was cancelled. Use the ids from get_today.",
      inputSchema: z.object({ ids: z.array(z.string().min(1).max(256)).min(1).max(50) }),
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    async ({ ids }) => touched(() => h.removeCalendarEvents(ctx, ids)),
  );

  server.registerTool(
    "report_connections",
    {
      title: "Report connections",
      description:
        'Tells Taskly which of the user\'s sources you can read right now, for its health check. Use when the user asks "Taskly, check my connections".',
      inputSchema: z.object({ sources: z.array(sourceKind).max(SOURCE_KINDS.length) }),
      annotations: { idempotentHint: true },
    },
    async ({ sources }) => json(await h.reportConnections(ctx, sources)),
  );

  return server;
}
