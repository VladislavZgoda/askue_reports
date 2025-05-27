ALTER TABLE "newYearMetersTable" RENAME TO "new_year_meters";--> statement-breakpoint
ALTER TABLE "new_year_meters" DROP CONSTRAINT "newYearMetersTable_transformer_Substation_id_transformer_substations_id_fk";
--> statement-breakpoint
ALTER TABLE "new_year_meters" ADD CONSTRAINT "new_year_meters_transformer_Substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_Substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;