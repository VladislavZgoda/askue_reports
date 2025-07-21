import { db } from "~/.server/db";
import processRegisteredMetersInTx from "./registered-meters";
import processUnregisteredMetersInTx from "./unregistered-meters";
import processYearlyInstallations from "./yearly-installations";
import processMonthlyInstallations from "./monthly-installations";
import { insertMeterActionLog } from "~/.server/db-queries/meterActionLogs";

import type { BillingValidationForm } from "../../validation/billing-form-schema";

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
      addMessageToLog(tx, installation),
    ]);
  });
}

async function addMessageToLog(
  executor: Executor,
  installation: BillingInstallationData,
) {
  const { totalCount, registeredCount, balanceGroup, substationId } =
    installation;

  const time = new Date().toLocaleString("ru");
  const message = `Добавлено: ${totalCount} ${registeredCount} ${balanceGroup} ${time}`;
  await insertMeterActionLog(executor, message, substationId);
}
