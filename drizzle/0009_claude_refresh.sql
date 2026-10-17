CREATE TABLE "claude_changes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"batch_id" text NOT NULL,
	"position" integer NOT NULL,
	"task_id" text NOT NULL,
	"action" text NOT NULL,
	"title" text NOT NULL,
	"reason" text NOT NULL,
	"before" jsonb NOT NULL,
	"changes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"undone_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "user_edited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "claude_changes" ADD CONSTRAINT "claude_changes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "claude_changes_user_idx" ON "claude_changes" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "claude_changes_batch_idx" ON "claude_changes" USING btree ("batch_id");