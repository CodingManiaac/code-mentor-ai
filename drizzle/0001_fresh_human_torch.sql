CREATE TABLE "user_preferences" (
	"userId" text PRIMARY KEY NOT NULL,
	"explanationLevel" text DEFAULT 'intermediate' NOT NULL,
	"preferredLanguage" text DEFAULT 'javascript' NOT NULL,
	"themeAccent" text DEFAULT 'indigo' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;