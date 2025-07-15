DROP INDEX "month_foreign_key";--> statement-breakpoint
DROP INDEX "month_type_index";--> statement-breakpoint
DROP INDEX "month_date_index";--> statement-breakpoint
DROP INDEX "month_index";--> statement-breakpoint
DROP INDEX "month_year_index";--> statement-breakpoint
CREATE INDEX "idx_monthly_installations_main" ON "monthly_meter_installations" USING btree ("balance_group","transformer_substation_id","month","year","date");--> statement-breakpoint
CREATE INDEX "idx_monthly_installations_order" ON "monthly_meter_installations" USING btree ("balance_group","transformer_substation_id","month","year","date" DESC);