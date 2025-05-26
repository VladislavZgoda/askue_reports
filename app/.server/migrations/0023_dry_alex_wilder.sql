ALTER TABLE "electricityMeters" RENAME TO "electricity_meters";--> statement-breakpoint
ALTER TABLE "electricity_meters" DROP CONSTRAINT "electricityMeters_transformer_substation_id_transformer_substations_id_fk";
--> statement-breakpoint
DROP INDEX "transformerSubstation_id_index";--> statement-breakpoint
DROP INDEX "type_index";--> statement-breakpoint
ALTER TABLE "electricity_meters" ADD CONSTRAINT "electricity_meters_transformer_substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transformer_substation_id_index" ON "electricity_meters" USING btree ("transformer_substation_id");--> statement-breakpoint
CREATE INDEX "balance_group_index" ON "electricity_meters" USING btree ("balance_group");