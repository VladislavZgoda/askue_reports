DROP INDEX "log_foreign_key";--> statement-breakpoint
CREATE INDEX "meter_action_logs_transformer_substation_id_idx" ON "meter_action_logs" USING btree ("transformer_substation_id");