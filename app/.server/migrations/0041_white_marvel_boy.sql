DROP INDEX "transformer_substation_id_index";--> statement-breakpoint
CREATE INDEX "registered_meters_substation_id_idx" ON "registered_meters" USING btree ("transformer_substation_id");