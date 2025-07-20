import { db } from "~/.server/db";
import * as schema from "app/.server/schema";
import processRegisteredMetersInTx from "./registered-meters";
import processUnregisteredMetersInTx from "./unregistered-meters";
import processYearlyInstallations from "./yearly-installations";
import processMonthlyInstallations from "./monthly-installations";
import { insertMeterActionLog } from "~/.server/db-queries/meterActionLogs";

import type { BillingValidationForm } from "../../validation/billing-form-schema";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { Database } from "~/.server/db";

/**
 * Database executor type for transactional operations
 *
 * Handles both regular connections and transactions
 */
export type Executor =
  | Database
  | PgTransaction<
      PostgresJsQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >;

type BillingInstallationData = BillingValidationForm & {
  readonly substationId: number;
};

export default async function addBillingMeters(
  installation: BillingInstallationData,
) {
  const { totalCount, registeredCount } = installation;

  await db.transaction(async (tx) => {
    if (totalCount > registeredCount) {
      await processUnregisteredMetersInTx(tx, installation);
    }

    await Promise.all([
      processRegisteredMetersInTx(tx, installation),
      processYearlyInstallations(tx, installation),
      processMonthlyInstallations(tx, installation),
    ]);
  });

  await addMessageToLog(installation);
}

async function addMessageToLog(installation: BillingInstallationData) {
  const { totalCount, registeredCount, balanceGroup, substationId } =
    installation;

  const time = new Date().toLocaleString("ru");
  const message = `Добавлено: ${totalCount} ${registeredCount} ${balanceGroup} ${time}`;
  await insertMeterActionLog(message, substationId);
}
