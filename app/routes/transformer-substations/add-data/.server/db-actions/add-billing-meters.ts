import processRegisteredMeters from "./registered-meters";
import processUnregisteredMeters from "./unregistered-meters";
import processYearlyInstallations from "./yearly-installations";
import processMonthlyInstallations from "./monthly-installations";
import { insertMeterActionLog } from "~/.server/db-queries/meterActionLogs";
import type { BillingValidationForm } from "../../validation/billing-form-schema";

type FormData = BillingValidationForm & { readonly substationId: number };

export default async function addBillingMeters(formData: FormData) {
  const { totalCount, registeredCount } = formData;

  if (totalCount > registeredCount) {
    await processUnregisteredMeters(formData);
  }

  await Promise.all([
    processYearlyInstallations(formData),
    processMonthlyInstallations(formData),
    processRegisteredMeters(formData),
  ]);

  await addMessageToLog(formData);
}

async function addMessageToLog(formData: FormData) {
  const { totalCount, registeredCount, balanceGroup, substationId } = formData;

  const time = new Date().toLocaleString("ru");
  const message = `Добавлено: ${totalCount} ${registeredCount} ${balanceGroup} ${time}`;
  await insertMeterActionLog(message, substationId);
}
