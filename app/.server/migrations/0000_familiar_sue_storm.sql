CREATE TABLE IF NOT EXISTS "transformerSubstation" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(8) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transformerSubstation_name_unique" UNIQUE("name")
);
