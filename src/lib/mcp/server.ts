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

When the user asks to prepare their day (for example "Prepare my day in Taskly"):
1. Call get_today to see what is already planned.
2. Read today's events from the user's calendar connectors and save them with add_calendar_events (pass the calendar's event id as "id").
3. Read recent unread or important emails and messages from the user's connectors. For each one that needs an action from the user, create ONE short, actionable task with add_tasks: start with a verb ("Reply to Sarah about the Q4 plan"), set source.kind and source.url (link to the email or message) so the user can open it. Use due_time only when the source names a time. Use priority 3 only for real urgency.
4. Never create tasks for newsletters, notifications, receipts or things already done. Taskly skips duplicates, so running this twice is safe.
5. Finish with a two-sentence summary of the day.

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
        "Copies events from the user's calendars so Taskly can show the day's agenda and the next meeting. Pass the calendar's event id as `id` to avoid duplicates.",
      inputSchema: z.object({
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
          .min(1)
          .max(50),
      }),
      annotations: { idempotentHint: true },
    },
    async ({ events }) => touched(() => h.addEvents(ctx, events)),
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
