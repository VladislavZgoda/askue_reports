DO $$ BEGIN
 CREATE TYPE "public"."balanceType" AS ENUM('Быт', 'ЮР Sims', 'ЮР П2', 'ОДПУ Sims', 'ОДПУ П2');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "electricityMeters" (
	"id" serial PRIMARY KEY NOT NULL,
	"quantity" integer NOT NULL,
	"balanceType" "balanceType" NOT NULL,
	"date" date,
	"transformerSubstation" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "electricityMeters" ADD CONSTRAINT "electricityMeters_transformerSubstation_transformerSubstation_id_fk" FOREIGN KEY ("transformerSubstation") REFERENCES "public"."transformerSubstation"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
