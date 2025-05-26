ALTER TYPE "public"."balanceType" RENAME TO "balance_group";--> statement-breakpoint
ALTER TABLE "electricityMeters" RENAME COLUMN "balanceType" TO "balance_group";--> statement-breakpoint
ALTER TABLE "newMonthMetersTable" RENAME COLUMN "balanceType" TO "balance_group";--> statement-breakpoint
ALTER TABLE "newYearMetersTable" RENAME COLUMN "balanceType" TO "balance_group";--> statement-breakpoint
ALTER TABLE "notInSystem" RENAME COLUMN "balanceType" TO "balance_group";--> statement-breakpoint
DROP INDEX "type_index";--> statement-breakpoint
DROP INDEX "month_type_index";--> statement-breakpoint
DROP INDEX "year_type_index";--> statement-breakpoint
DROP INDEX "not_in_system_type_index";--> statement-breakpoint
CREATE INDEX "type_index" ON "electricityMeters" USING btree ("balance_group");--> statement-breakpoint
CREATE INDEX "month_type_index" ON "newMonthMetersTable" USING btree ("balance_group");--> statement-breakpoint
CREATE INDEX "year_type_index" ON "newYearMetersTable" USING btree ("balance_group");--> statement-breakpoint
CREATE INDEX "not_in_system_type_index" ON "notInSystem" USING btree ("balance_group");