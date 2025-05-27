ALTER TABLE "newMonthMetersTable" RENAME TO "new_month_meters";--> statement-breakpoint
ALTER TABLE "new_month_meters" DROP CONSTRAINT "newMonthMetersTable_transformer_substation_id_transformer_substations_id_fk";
--> statement-breakpoint
ALTER TABLE "new_month_meters" ADD CONSTRAINT "new_month_meters_transformer_substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;