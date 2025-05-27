ALTER TABLE "metersActionLog" RENAME TO "meter_action_logs";--> statement-breakpoint
ALTER TABLE "meter_action_logs" DROP CONSTRAINT "metersActionLog_transformer_substation_id_transformer_substations_id_fk";
--> statement-breakpoint
ALTER TABLE "meter_action_logs" ADD CONSTRAINT "meter_action_logs_transformer_substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;