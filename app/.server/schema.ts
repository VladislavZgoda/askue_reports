import {
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
  date,
  text,
  index,
} from "drizzle-orm/pg-core";

import { relations, sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .notNull(),
};

export const transformerSubstations = pgTable(
  "transformer_substations",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 15 }).unique().notNull(),
    ...timestamps,
  },
  (table) => {
    return [index("id_index").on(table.id)];
  },
);

export const transformerSubstationsRelations = relations(
  transformerSubstations,
  ({ many }) => ({
    meterCounts: many(meterCounts),
    yearlyMeterInstallations: many(yearlyMeterInstallations),
    monthlyMeterInstallations: many(monthlyMeterInstallations),
    technicalMeters: many(technicalMeters),
  }),
);

export const balanceGroupEnum = pgEnum("balance_group", [
  "Быт",
  "ЮР Sims",
  "ЮР П2",
  "ОДПУ Sims",
  "ОДПУ П2",
]);

export type BalanceGroup = (typeof balanceGroupEnum.enumValues)[number];

const transformerSubstationForeignKey = {
  transformerSubstationId: integer("transformer_substation_id")
    .references(() => transformerSubstations.id, {
      onDelete: "cascade",
    })
    .notNull(),
};

export const meterCounts = pgTable(
  "meter_counts",
  {
    id: serial("id").primaryKey(),
    registeredMeterCount: integer("registered_count").notNull(),
    unregisteredCount: integer("unregistered_count").notNull(),
    balanceGroup: balanceGroupEnum("balance_group").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    ...transformerSubstationForeignKey,
    ...timestamps,
  },
  (table) => {
    return [
      index("meter_counts_substation_id_idx").on(table.transformerSubstationId),
      index("meter_counts_composite_idx").on(
        table.balanceGroup,
        table.transformerSubstationId,
        sql`${table.date} DESC`,
      ),
    ];
  },
);

export const meterCountsRelations = relations(meterCounts, ({ one }) => ({
  transformerSubstation: one(transformerSubstations, {
    fields: [meterCounts.transformerSubstationId],
    references: [transformerSubstations.id],
  }),
}));

export const yearlyMeterInstallations = pgTable(
  "yearly_meter_installations",
  {
    id: serial("id").primaryKey(),
    totalInstalled: integer("total_installed").notNull(),
    registeredCount: integer("registered_count").notNull(),
    balanceGroup: balanceGroupEnum("balance_group").notNull(),
    year: integer("year").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    ...transformerSubstationForeignKey,
    ...timestamps,
  },
  (table) => {
    return [
      index("idx_yearly_installations_main").on(
        table.balanceGroup,
        table.transformerSubstationId,
        table.year,
        table.date,
      ),
      index("idx_yearly_installations_order").on(
        table.balanceGroup,
        table.transformerSubstationId,
        table.year,
        sql`${table.date} DESC`,
      ),
    ];
  },
);

export const yearlyMeterInstallationsRelations = relations(
  yearlyMeterInstallations,
  ({ one }) => ({
    transformerSubstation: one(transformerSubstations, {
      fields: [yearlyMeterInstallations.transformerSubstationId],
      references: [transformerSubstations.id],
    }),
  }),
);

export const monthlyMeterInstallations = pgTable(
  "monthly_meter_installations",
  {
    id: serial("id").primaryKey(),
    totalInstalled: integer("total_installed").notNull(),
    registeredCount: integer("registered_count").notNull(),
    balanceGroup: balanceGroupEnum("balance_group").notNull(),
    month: varchar("month", { length: 2 }).notNull(),
    year: integer("year").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    ...transformerSubstationForeignKey,
    ...timestamps,
  },
  (table) => {
    return [
      index("idx_monthly_installations_main").on(
        table.balanceGroup,
        table.transformerSubstationId,
        table.month,
        table.year,
        table.date,
      ),
      index("idx_monthly_installations_order").on(
        table.balanceGroup,
        table.transformerSubstationId,
        table.month,
        table.year,
        sql`${table.date} DESC`,
      ),
    ];
  },
);

export const monthlyMeterInstallationsRelations = relations(
  monthlyMeterInstallations,
  ({ one }) => ({
    transformerSubstation: one(transformerSubstations, {
      fields: [monthlyMeterInstallations.transformerSubstationId],
      references: [transformerSubstations.id],
    }),
  }),
);

export const meterActionLogs = pgTable(
  "meter_action_logs",
  {
    id: serial("id").primaryKey(),
    message: text("message").notNull(),
    created_at: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    ...transformerSubstationForeignKey,
  },
  (table) => {
    return [
      index("meter_action_logs_transformer_substation_id_idx").on(
        table.transformerSubstationId,
      ),
    ];
  },
);

export const technicalMeters = pgTable("technical_meters", {
  id: serial("id").primaryKey(),
  quantity: integer("quantity").notNull(),
  underVoltage: integer("under_voltage").notNull(),
  ...transformerSubstationForeignKey,
  ...timestamps,
});

export const technicalMetersRelations = relations(
  technicalMeters,
  ({ one }) => ({
    transformerSubstation: one(transformerSubstations, {
      fields: [technicalMeters.transformerSubstationId],
      references: [transformerSubstations.id],
    }),
  }),
);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name").unique().notNull(),
  password: varchar("password").notNull(),
  userId: varchar("user_id").notNull(),
  ...timestamps,
});
