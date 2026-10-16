/** Where a task Claude created comes from. Shared by the schema and the UI. */
export const SOURCE_KINDS = ["gmail", "outlook", "calendar", "slack", "teams", "notion", "other"] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];
