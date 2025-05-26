ALTER TABLE "transformerSubstation" RENAME TO "transformer_substations";--> statement-breakpoint
ALTER TABLE "electricityMeters" RENAME COLUMN "transformerSubstation" TO "transformer_substation_id";--> statement-breakpoint
ALTER TABLE "metersActionLog" RENAME COLUMN "transformerSubstation" TO "transformer_substation_id";--> statement-breakpoint
ALTER TABLE "newMonthMetersTable" RENAME COLUMN "transformerSubstation" TO "transformer_substation_id";--> statement-breakpoint
ALTER TABLE "newYearMetersTable" RENAME COLUMN "transformerSubstation" TO "transformer_Substation_id";--> statement-breakpoint
ALTER TABLE "notInSystem" RENAME COLUMN "transformerSubstation" TO "transformer_substation_id";--> statement-breakpoint
ALTER TABLE "technicalMeters" RENAME COLUMN "transformerSubstation" TO "transformer_substation_id";--> statement-breakpoint
ALTER TABLE "transformer_substations" DROP CONSTRAINT "transformerSubstation_name_unique";--> statement-breakpoint
ALTER TABLE "electricityMeters" DROP CONSTRAINT "electricityMeters_transformerSubstation_transformerSubstation_id_fk";
--> statement-breakpoint
ALTER TABLE "metersActionLog" DROP CONSTRAINT "metersActionLog_transformerSubstation_transformerSubstation_id_fk";
--> statement-breakpoint
ALTER TABLE "newMonthMetersTable" DROP CONSTRAINT "newMonthMetersTable_transformerSubstation_transformerSubstation_id_fk";
--> statement-breakpoint
ALTER TABLE "newYearMetersTable" DROP CONSTRAINT "newYearMetersTable_transformerSubstation_transformerSubstation_id_fk";
--> statement-breakpoint
ALTER TABLE "notInSystem" DROP CONSTRAINT "notInSystem_transformerSubstation_transformerSubstation_id_fk";
--> statement-breakpoint
ALTER TABLE "technicalMeters" DROP CONSTRAINT "technicalMeters_transformerSubstation_transformerSubstation_id_fk";
--> statement-breakpoint
DROP INDEX "transformerSubstation_id_index";--> statement-breakpoint
DROP INDEX "log_foreign_key";--> statement-breakpoint
DROP INDEX "month_foreign_key";--> statement-breakpoint
DROP INDEX "year_foreign_key";--> statement-breakpoint
DROP INDEX "not_in_system_foreign_key";--> statement-breakpoint
ALTER TABLE "electricityMeters" ADD CONSTRAINT "electricityMeters_transformer_substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metersActionLog" ADD CONSTRAINT "metersActionLog_transformer_substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newMonthMetersTable" ADD CONSTRAINT "newMonthMetersTable_transformer_substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newYearMetersTable" ADD CONSTRAINT "newYearMetersTable_transformer_Substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_Substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notInSystem" ADD CONSTRAINT "notInSystem_transformer_substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technicalMeters" ADD CONSTRAINT "technicalMeters_transformer_substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transformerSubstation_id_index" ON "electricityMeters" USING btree ("transformer_substation_id");--> statement-breakpoint
CREATE INDEX "log_foreign_key" ON "metersActionLog" USING btree ("transformer_substation_id");--> statement-breakpoint
CREATE INDEX "month_foreign_key" ON "newMonthMetersTable" USING btree ("transformer_substation_id");--> statement-breakpoint
CREATE INDEX "year_foreign_key" ON "newYearMetersTable" USING btree ("transformer_Substation_id");--> statement-breakpoint
CREATE INDEX "not_in_system_foreign_key" ON "notInSystem" USING btree ("transformer_substation_id");--> statement-breakpoint
ALTER TABLE "transformer_substations" ADD CONSTRAINT "transformer_substations_name_unique" UNIQUE("name");