CREATE INDEX IF NOT EXISTS "failed_meters_foreign_key" ON "failedMeters" USING btree ("transformerSubstation");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "failed_meters_type_index" ON "failedMeters" USING btree ("balanceType");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "month_foreign_key" ON "newMonthMetersTable" USING btree ("transformerSubstation");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "month_type_index" ON "newMonthMetersTable" USING btree ("balanceType");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "year_foreign_key" ON "newYearMetersTable" USING btree ("transformerSubstation");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "year_type_index" ON "newYearMetersTable" USING btree ("balanceType");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "not_in_system_foreign_key" ON "notInSystem" USING btree ("transformerSubstation");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "not_in_system_type_index" ON "notInSystem" USING btree ("balanceType");