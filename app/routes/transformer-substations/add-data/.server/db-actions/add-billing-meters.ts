import { db } from "~/.server/db";
import processRegisteredMetersInTx from "./registered-meters";
import processUnregisteredMetersInTx from "./unregistered-meters";
import processYearlyInstallations from "./yearly-installations";
import processMonthlyInstallations from "./monthly-installations";
import { insertMeterActionLog } from "~/.server/db-queries/meterActionLogs";

import type { BillingValidationForm } from "../../validation/billing-form.schema";

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
      logBillingMeterAction(tx, installation),
    ]);
  });
}

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
  const message = `${balanceGroup}: ${totalCount} ${registeredCount} ${date}. Добавлено: ${timestamp}`;
  await insertMeterActionLog(executor, message, substationId);
}
