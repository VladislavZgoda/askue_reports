ALTER TABLE "new_year_meters" RENAME COLUMN "transformer_Substation_id" TO "transformer_substation_id";--> statement-breakpoint
ALTER TABLE "new_year_meters" DROP CONSTRAINT "new_year_meters_transformer_Substation_id_transformer_substations_id_fk";
--> statement-breakpoint
DROP INDEX "year_foreign_key";--> statement-breakpoint
ALTER TABLE "new_year_meters" ADD CONSTRAINT "new_year_meters_transformer_substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "year_foreign_key" ON "new_year_meters" USING btree ("transformer_substation_id");