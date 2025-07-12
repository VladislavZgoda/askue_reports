DROP INDEX "year_foreign_key";--> statement-breakpoint
DROP INDEX "year_type_index";--> statement-breakpoint
DROP INDEX "year_date_index";--> statement-breakpoint
DROP INDEX "year_index";--> statement-breakpoint
CREATE INDEX "idx_yearly_installations_main" ON "yearly_meter_installations" USING btree ("balance_group","transformer_substation_id","year","date");--> statement-breakpoint
CREATE INDEX "idx_yearly_installations_order" ON "yearly_meter_installations" USING btree ("balance_group","transformer_substation_id","year","date" DESC);