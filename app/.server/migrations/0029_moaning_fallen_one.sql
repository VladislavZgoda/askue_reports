ALTER TABLE "technicalMeters" RENAME TO "technical_meters";--> statement-breakpoint
ALTER TABLE "technical_meters" RENAME COLUMN "underVoltage" TO "under_voltage";--> statement-breakpoint
ALTER TABLE "technical_meters" DROP CONSTRAINT "technicalMeters_transformer_substation_id_transformer_substations_id_fk";
--> statement-breakpoint
ALTER TABLE "technical_meters" ADD CONSTRAINT "technical_meters_transformer_substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;