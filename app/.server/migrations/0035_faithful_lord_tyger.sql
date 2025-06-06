ALTER TABLE "new_month_meters" RENAME TO "monthly_meter_installations";--> statement-breakpoint
ALTER TABLE "monthly_meter_installations" RENAME COLUMN "quantity" TO "total_installed";--> statement-breakpoint
ALTER TABLE "monthly_meter_installations" RENAME COLUMN "added_to_system" TO "registered_count";--> statement-breakpoint
ALTER TABLE "monthly_meter_installations" DROP CONSTRAINT "new_month_meters_transformer_substation_id_transformer_substations_id_fk";
--> statement-breakpoint
ALTER TABLE "monthly_meter_installations" ADD CONSTRAINT "monthly_meter_installations_transformer_substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;