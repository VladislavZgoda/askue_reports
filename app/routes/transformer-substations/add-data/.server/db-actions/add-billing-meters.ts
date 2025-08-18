import { db } from "~/.server/db";
import processRegisteredMetersInTx from "./process-registered-meters";
import processUnregisteredMetersInTx from "./process-unregistered-meters";
import processYearlyInstallations from "./process-yearly-installations";
import processMonthlyInstallations from "./monthly-installations";
import { insertMeterActionLog } from "~/.server/db-queries/meterActionLogs";

import type { BillingValidationForm } from "../../validation/billing-form.schema";

/**
 * Validated billing meter installation data
 *
 * @property substationId - ID of the associated transformer substation
 * @property balanceGroup - Balance group category (e.g., "Быт", "ЮР Sims")
 * @property totalCount - Total meters installed
 * @property registeredCount - Meters registered in the billing system
 * @property date - Installation date in YYYY-MM-DD format
 */
type BillingInstallationData = BillingValidationForm & {
  readonly substationId: number;
};

/**
 * Processes billing meter installation atomically within a database transaction
 *
 * @remarks
 * Performs in this order:
 * 1. Processes unregistered meters (if any)
 * 2. Processes registered meters, yearly installations, monthly installations, and audit log in parallel
 *
 * All operations succeed or fail together due to transaction wrapper.
 *
 * @param installation - Billing meter installation data
 * @throws {Error} If any sub-operation fails, triggering transaction rollback
 *
 * @example
 * await addBillingMeters({
 *   substationId: 42,
 *   balanceGroup: 'ЮР П2',
 *   totalCount: 15,
 *   registeredCount: 12,
 *   date: '2023-06-15'
 * });
 */
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
      logBillingMeterAction(tx, installation),
    ]);
  });
}

/**
 * Creates audit log entry for billing meter installation
 *
 * @param executor - Database executor (transaction or connection)
 * @param installation - Billing installation data
 *
 * @example
 * Log format: "ЮР П2: 15 12 15.06.2023. Добавлено: 19.07.2023, 14:25:03"
 */
async function logBillingMeterAction(
  executor: Executor,
  {
    totalCount,
    registeredCount,
    balanceGroup,
    substationId,
    date,
  }: BillingInstallationData,
) {
  const timestamp = new Date().toLocaleString("ru");
  const localDate = new Date(date).toLocaleString("ru").slice(0, 10);
  const message = `${balanceGroup}: ${totalCount} ${registeredCount} ${localDate}. Добавлено: ${timestamp}`;

  await insertMeterActionLog(executor, message, substationId);
}
