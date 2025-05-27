ALTER TABLE "notInSystem" RENAME TO "not_in_system";--> statement-breakpoint
ALTER TABLE "not_in_system" DROP CONSTRAINT "notInSystem_transformer_substation_id_transformer_substations_id_fk";
--> statement-breakpoint
ALTER TABLE "not_in_system" ADD CONSTRAINT "not_in_system_transformer_substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;