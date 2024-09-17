DROP INDEX IF EXISTS "id_index";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "date_index" ON "electricityMeters" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "log_foreign_key" ON "metersActionLog" USING btree ("transformerSubstation");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "month_date_index" ON "newMonthMetersTable" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "month_index" ON "newMonthMetersTable" USING btree ("month");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "month_year_index" ON "newMonthMetersTable" USING btree ("year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "year_date_index" ON "newYearMetersTable" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "year_index" ON "newYearMetersTable" USING btree ("year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "not_in_system_date_index" ON "notInSystem" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "id_index" ON "transformerSubstation" USING btree ("id");