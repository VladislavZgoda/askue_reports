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

export const balanceGroupEnum = pgEnum("balance_group", [
  "Быт",
  "ЮР Sims",
  "ЮР П2",
  "ОДПУ Sims",
  "ОДПУ П2",
]);

export const ElectricityMetersTable = pgTable(
  "electricityMeters",
  {
    id: serial("id").primaryKey(),
    quantity: integer("quantity").notNull(),
    type: balanceGroupEnum("balance_group").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    transformerSubstationId: integer("transformer_substation_id")
      .references(() => transformerSubstations.id, {
        onDelete: "cascade",
      })
      .notNull(),
    ...timestamps,
  },
  (table) => {
    return [
      index("transformerSubstation_id_index").on(table.transformerSubstationId),
      index("type_index").on(table.type),
      index("date_index").on(table.date),
    ];
  },
);

export const NewYearMetersTable = pgTable(
  "newYearMetersTable",
  {
    id: serial("id").primaryKey(),
    quantity: integer("quantity").notNull(),
    added_to_system: integer("added_to_system").notNull(),
    type: balanceGroupEnum("balance_group").notNull(),
    year: integer("year").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    transformerSubstationId: integer("transformer_Substation_id")
      .references(() => transformerSubstations.id, {
        onDelete: "cascade",
      })
      .notNull(),
    ...timestamps,
  },
  (table) => {
    return [
      index("year_foreign_key").on(table.transformerSubstationId),
      index("year_type_index").on(table.type),
      index("year_date_index").on(table.date),
      index("year_index").on(table.year),
    ];
  },
);

export const NewMonthMetersTable = pgTable(
  "newMonthMetersTable",
  {
    id: serial("id").primaryKey(),
    quantity: integer("quantity").notNull(),
    added_to_system: integer("added_to_system").notNull(),
    type: balanceGroupEnum("balance_group").notNull(),
    month: varchar("month", { length: 2 }).notNull(),
    year: integer("year").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    transformerSubstationId: integer("transformer_substation_id")
      .references(() => transformerSubstations.id, {
        onDelete: "cascade",
      })
      .notNull(),
    ...timestamps,
  },
  (table) => {
    return [
      index("month_foreign_key").on(table.transformerSubstationId),
      index("month_type_index").on(table.type),
      index("month_date_index").on(table.date),
      index("month_index").on(table.month),
      index("month_year_index").on(table.year),
    ];
  },
);

export const NotInSystem = pgTable(
  "notInSystem",
  {
    id: serial("id").primaryKey(),
    quantity: integer("quantity").notNull(),
    type: balanceGroupEnum("balance_group").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    transformerSubstationId: integer("transformer_substation_id")
      .references(() => transformerSubstations.id, {
        onDelete: "cascade",
      })
      .notNull(),
    ...timestamps,
  },
  (table) => {
    return [
      index("not_in_system_foreign_key").on(table.transformerSubstationId),
      index("not_in_system_type_index").on(table.type),
      index("not_in_system_date_index").on(table.date),
    ];
  },
);

export const MetersActionLog = pgTable(
  "metersActionLog",
  {
    id: serial("id").primaryKey(),
    message: text("message").notNull(),
    transformerSubstationId: integer("transformer_substation_id")
      .references(() => transformerSubstations.id, {
        onDelete: "cascade",
      })
      .notNull(),
    created_at: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return [index("log_foreign_key").on(table.transformerSubstationId)];
  },
);

export const TechnicalMeters = pgTable("technicalMeters", {
  id: serial("id").primaryKey(),
  quantity: integer("quantity").notNull(),
  underVoltage: integer("underVoltage").notNull(),
  transformerSubstationId: integer("transformer_substation_id")
    .references(() => transformerSubstations.id, {
      onDelete: "cascade",
    })
    .notNull(),
  ...timestamps,
});

export const Users = pgTable("users", {
  id: serial("id").primaryKey(),
  useLogin: varchar("name").unique().notNull(),
  password: varchar("password").notNull(),
  userId: varchar("userId").notNull(),
  ...timestamps,
});
