DROP INDEX "not_in_system_foreign_key";--> statement-breakpoint
DROP INDEX "not_in_system_type_index";--> statement-breakpoint
DROP INDEX "not_in_system_date_index";--> statement-breakpoint
CREATE INDEX "unregistered_meters_composite_idx" ON "unregistered_meters" USING btree ("balance_group","transformer_substation_id","date" DESC);--> statement-breakpoint
CREATE INDEX "unregistered_meters_substation_id_idx" ON "unregistered_meters" USING btree ("transformer_substation_id");