CREATE TABLE IF NOT EXISTS "technicalMeters" (
	"id" serial PRIMARY KEY NOT NULL,
	"quantity" integer NOT NULL,
	"transformerSubstation" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "technicalMeters" ADD CONSTRAINT "technicalMeters_transformerSubstation_transformerSubstation_id_fk" FOREIGN KEY ("transformerSubstation") REFERENCES "public"."transformerSubstation"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
