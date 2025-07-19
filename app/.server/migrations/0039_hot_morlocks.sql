DROP INDEX "balance_group_index";--> statement-breakpoint
DROP INDEX "date_index";--> statement-breakpoint
CREATE INDEX "registered_meters_composite_idx" ON "registered_meters" USING btree ("balance_group","transformer_substation_id","date" DESC);