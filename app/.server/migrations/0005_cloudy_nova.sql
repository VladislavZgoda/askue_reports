CREATE TABLE IF NOT EXISTS "newMonthMetersTable" (
	"id" serial PRIMARY KEY NOT NULL,
	"quantity" integer NOT NULL,
	"added_to_system" integer NOT NULL,
	"balanceType" "balanceType" NOT NULL,
	"month" varchar(2) NOT NULL,
	"year" integer NOT NULL,
	"date" date NOT NULL,
	"transformerSubstation" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "newMonthMetersTable" ADD CONSTRAINT "newMonthMetersTable_transformerSubstation_transformerSubstation_id_fk" FOREIGN KEY ("transformerSubstation") REFERENCES "public"."transformerSubstation"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
