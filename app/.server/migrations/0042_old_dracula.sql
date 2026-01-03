ALTER TABLE "unregistered_meters" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "unregistered_meters" CASCADE;--> statement-breakpoint
ALTER TABLE "registered_meters" RENAME TO "meter_counts";--> statement-breakpoint
ALTER TABLE "meter_counts" RENAME COLUMN "registered_meter_count" TO "registered_count";--> statement-breakpoint
ALTER TABLE "meter_counts" DROP CONSTRAINT "registered_meters_transformer_substation_id_transformer_substations_id_fk";
--> statement-breakpoint
DROP INDEX "registered_meters_substation_id_idx";--> statement-breakpoint
DROP INDEX "registered_meters_composite_idx";--> statement-breakpoint
ALTER TABLE "meter_counts" ADD COLUMN "unregistered_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "meter_counts" ADD CONSTRAINT "meter_counts_transformer_substation_id_transformer_substations_id_fk" FOREIGN KEY ("transformer_substation_id") REFERENCES "public"."transformer_substations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meter_counts_substation_id_idx" ON "meter_counts" USING btree ("transformer_substation_id");--> statement-breakpoint
CREATE INDEX "meter_counts_composite_idx" ON "meter_counts" USING btree ("balance_group","transformer_substation_id","date" DESC);