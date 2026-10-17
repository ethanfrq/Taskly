/*
 * Taskly never calls Claude (ADR 0001): to get the day prepared, it opens
 * Claude with the request already typed, and Claude answers it through the
 * Taskly connector.
 */

/**
 * claude.ai with a sentence in the message box. The ?q= prefill isn't
 * documented by Anthropic, so wherever this link is offered the sentence is
 * also shown or copied, to be typed by hand if Claude opens empty.
 */
export function claudePromptUrl(prompt: string): string {
  return `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;
}

/** Whether Claude has called Taskly since the start of the user's day (any MCP call sets claudeSeenAt). */
export function claudeCameToday(claudeSeenAt: Date | null, startOfToday: Date): boolean {
  return !!claudeSeenAt && claudeSeenAt >= startOfToday;
}
