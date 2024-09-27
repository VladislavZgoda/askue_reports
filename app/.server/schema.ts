import {
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
  date,
  text,
  index
} from 'drizzle-orm/pg-core';

export const TransformerSubstationTable =
  pgTable('transformerSubstation', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 15 }).unique().notNull(),
    created_at: timestamp('created_at', {
      withTimezone: true,
      mode: 'date'
    }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow().notNull(),
  }, (table) => {
    return { idIndex: index('id_index').on(table.id) };
  });

export const BalanceType = pgEnum('balanceType', [
  'Быт', 'ЮР Sims', 'ЮР П2', 'ОДПУ Sims', 'ОДПУ П2'
]);

export const ElectricityMetersTable =
  pgTable('electricityMeters', {
    id: serial('id').primaryKey(),
    quantity: integer('quantity').notNull(),
    type: BalanceType('balanceType').notNull(),
    date: date('date', { mode: "string" }).notNull(),
    transformerSubstationId: integer('transformerSubstation')
      .references(() => TransformerSubstationTable.id, {
        'onDelete': 'cascade'
      }).notNull(),
    created_at: timestamp('created_at', {
      withTimezone: true,
      mode: 'date'
    }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow().notNull(),
  }, (table) => {
    return { 
      transformerSubstationIdIndex: index('transformerSubstation_id_index')
      .on(table.transformerSubstationId),
      typeIndex: index('type_index').on(table.type),
      dateIndex: index('date_index').on(table.date),
    };
  });

export const NewYearMetersTable =
  pgTable('newYearMetersTable', {
    id: serial('id').primaryKey(),
    quantity: integer('quantity').notNull(),
    added_to_system: integer('added_to_system').notNull(),
    type: BalanceType('balanceType').notNull(),
    year: integer('year').notNull(),
    date: date('date', { mode: "string" }).notNull(),
    transformerSubstationId: integer('transformerSubstation')
      .references(() => TransformerSubstationTable.id, {
        'onDelete': 'cascade'
      }).notNull(),
    created_at: timestamp('created_at', {
      withTimezone: true,
      mode: 'date'
    }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow().notNull(),
  }, (table) => {
    return { 
      yearForeignKey: index('year_foreign_key')
      .on(table.transformerSubstationId),
      yearTypeIndex: index('year_type_index').on(table.type),
      yearDateIndex: index('year_date_index').on(table.date),
      yearIndex: index('year_index').on(table.year),
    };
  });

export const NewMonthMetersTable =
  pgTable('newMonthMetersTable', {
    id: serial('id').primaryKey(),
    quantity: integer('quantity').notNull(),
    added_to_system: integer('added_to_system').notNull(),
    type: BalanceType('balanceType').notNull(),
    month: varchar('month', { length: 2 }).notNull(),
    year: integer('year').notNull(),
    date: date('date', { mode: "string" }).notNull(),
    transformerSubstationId: integer('transformerSubstation')
      .references(() => TransformerSubstationTable.id, {
        'onDelete': 'cascade'
      }).notNull(),
    created_at: timestamp('created_at', {
      withTimezone: true,
      mode: 'date'
    }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow().notNull(),
  }, (table) => {
    return { 
      monthForeignKey: index('month_foreign_key')
      .on(table.transformerSubstationId),
      monthTypeIndex: index('month_type_index').on(table.type),
      monthDateIndex: index('month_date_index').on(table.date),
      monthIndex: index('month_index').on(table.month),
      monthYearIndex: index('month_year_index').on(table.year),
    };
  });

export const NotInSystem =
  pgTable('notInSystem', {
    id: serial('id').primaryKey(),
    quantity: integer('quantity').notNull(),
    type: BalanceType('balanceType').notNull(),
    date: date('date', { mode: "string" }).notNull(),
    transformerSubstationId: integer('transformerSubstation')
      .references(() => TransformerSubstationTable.id, {
        'onDelete': 'cascade'
      }).notNull(),
    created_at: timestamp('created_at', {
      withTimezone: true,
      mode: 'date'
    }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow().notNull(),
  }, (table) => {
    return { 
      notInSystemForeignKey: index('not_in_system_foreign_key')
      .on(table.transformerSubstationId),
      notInSystemTypeIndex: index('not_in_system_type_index').on(table.type),
      notInSystemDateIndex: index('not_in_system_date_index').on(table.date)
    };
  });

export const MetersActionLog =
  pgTable('metersActionLog', {
    id: serial('id').primaryKey(),
    message: text('message').notNull(),
    transformerSubstationId: integer('transformerSubstation')
      .references(() => TransformerSubstationTable.id, {
        'onDelete': 'cascade'
      }).notNull(),
    created_at: timestamp('created_at', {
      withTimezone: true,
      mode: 'date'
    }).defaultNow().notNull(),
  }, (table) => {
    return { 
      logForeignKey: index('log_foreign_key')
      .on(table.transformerSubstationId),
    };
  });

export const TechnicalMeters =
  pgTable('technicalMeters', {
    id: serial('id').primaryKey(),
    quantity: integer('quantity').notNull(),
    underVoltage: integer('underVoltage').notNull(),
    transformerSubstationId: integer('transformerSubstation')
      .references(() => TransformerSubstationTable.id, {
        'onDelete': 'cascade'
      }).notNull(),
    created_at: timestamp('created_at', {
      withTimezone: true,
      mode: 'date'
    }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow().notNull(),
  });

export const DisabledLegalMeters =
  pgTable('disabledLegalMeters', {
    id: serial('id').primaryKey(),
    quantity: integer('quantity').notNull(),
    transformerSubstationId: integer('transformerSubstation')
      .references(() => TransformerSubstationTable.id, {
        'onDelete': 'cascade'
      }).notNull(),
    created_at: timestamp('created_at', {
      withTimezone: true,
      mode: 'date'
    }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow().notNull(),
  });

export const FailedMeters =
  pgTable('failedMeters', {
    id: serial('id').primaryKey(),
    quantity: integer('quantity').notNull(),
    type: BalanceType('balanceType').notNull(),
    transformerSubstationId: integer('transformerSubstation')
      .references(() => TransformerSubstationTable.id, {
        'onDelete': 'cascade'
      }).notNull(),
    created_at: timestamp('created_at', {
      withTimezone: true,
      mode: 'date'
    }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow().notNull(),
  }, (table) => {
    return { 
      transSubsIdIndex: index('failed_meters_foreign_key')
      .on(table.transformerSubstationId),
      failedMetersTypeIndex: index('failed_meters_type_index').on(table.type),
    };
  });

export const Users =
  pgTable('users', {
    id: serial('id').primaryKey(),
    useLogin: varchar('name').unique().notNull(),
    password: varchar('password').notNull(),
    userId: varchar('userId').notNull(),
    created_at: timestamp('created_at', {
      withTimezone: true,
      mode: 'date'
    }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow().notNull(),
  });
