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

import { relations } from "drizzle-orm";

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
    registeredMeters: many(registeredMeters),
    unregisteredMeters: many(unregisteredMeters),
    yearlyMeterInstallations: many(yearlyMeterInstallations),
    monthlyMeterInstallations: many(monthlyMeterInstallations),
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

export const registeredMeters = pgTable(
  "registered_meters",
  {
    id: serial("id").primaryKey(),
    registeredMeterCount: integer("registered_meter_count").notNull(),
    balanceGroup: balanceGroupEnum("balance_group").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    ...transformerSubstationForeignKey,
    ...timestamps,
  },
  (table) => {
    return [
      index("transformer_substation_id_index").on(
        table.transformerSubstationId,
      ),
      index("balance_group_index").on(table.balanceGroup),
      index("date_index").on(table.date),
    ];
  },
);

export const registeredMetersRelations = relations(
  registeredMeters,
  ({ one }) => ({
    transformerSubstation: one(transformerSubstations, {
      fields: [registeredMeters.transformerSubstationId],
      references: [transformerSubstations.id],
    }),
  }),
);

export const unregisteredMeters = pgTable(
  "unregistered_meters",
  {
    id: serial("id").primaryKey(),
    unregisteredMeterCount: integer("unregistered_meter_count").notNull(),
    balanceGroup: balanceGroupEnum("balance_group").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    ...transformerSubstationForeignKey,
    ...timestamps,
  },
  (table) => {
    return [
      index("not_in_system_foreign_key").on(table.transformerSubstationId),
      index("not_in_system_type_index").on(table.balanceGroup),
      index("not_in_system_date_index").on(table.date),
    ];
  },
);

export const unregisteredMetersRelations = relations(
  unregisteredMeters,
  ({ one }) => ({
    transformerSubstation: one(transformerSubstations, {
      fields: [unregisteredMeters.transformerSubstationId],
      references: [transformerSubstations.id],
    }),
  }),
);

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
      index("year_foreign_key").on(table.transformerSubstationId),
      index("year_type_index").on(table.balanceGroup),
      index("year_date_index").on(table.date),
      index("year_index").on(table.year),
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
      index("month_foreign_key").on(table.transformerSubstationId),
      index("month_type_index").on(table.balanceGroup),
      index("month_date_index").on(table.date),
      index("month_index").on(table.month),
      index("month_year_index").on(table.year),
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

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name").unique().notNull(),
  password: varchar("password").notNull(),
  userId: varchar("user_id").notNull(),
  ...timestamps,
});
