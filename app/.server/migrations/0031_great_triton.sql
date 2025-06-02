ALTER TABLE "not_in_system" RENAME TO "unregistered_meters";--> statement-breakpoint
ALTER TABLE "unregistered_meters" RENAME COLUMN "quantity" TO "unregistered_count";--> statement-breakpoint
ALTER TABLE "unregistered_meters" DROP CONSTRAINT "not_in_system_transformer_substation_id_transformer_substations_id_fk";
--> statement-breakpoint
ALTER TABLE "unregistered_meters" ADD CONSTRAINT "unregistered_meters_transformer_substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;