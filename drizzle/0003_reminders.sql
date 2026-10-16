CREATE TABLE "reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"task_id" text,
	"kind" text NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reminders_due_idx" ON "reminders" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "reminders_task_idx" ON "reminders" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "reminders_user_kind_idx" ON "reminders" USING btree ("user_id","kind");