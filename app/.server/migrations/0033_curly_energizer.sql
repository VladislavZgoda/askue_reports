ALTER TABLE "electricity_meters" RENAME TO "registered_meters";--> statement-breakpoint
ALTER TABLE "registered_meters" RENAME COLUMN "quantity" TO "registered_meter_count";--> statement-breakpoint
ALTER TABLE "registered_meters" DROP CONSTRAINT "electricity_meters_transformer_substation_id_transformer_substations_id_fk";
--> statement-breakpoint
ALTER TABLE "registered_meters" ADD CONSTRAINT "registered_meters_transformer_substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;