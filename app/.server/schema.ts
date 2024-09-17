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
    name: varchar('name', { length: 8 }).unique().notNull(),
    created_at: timestamp('created_at', {
      withTimezone: true,
      mode: 'date'
    }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow().notNull(),
  }, (table) => {
    return { idIndex: index('id_index').on(table.name) };
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
