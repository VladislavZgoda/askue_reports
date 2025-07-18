import {
  getRegisteredMeterCount,
  updateRegisteredMeterCount,
  createRegisteredMeterRecord,
  getRegisteredMeterCountAtDate,
  updateRegisteredMeterRecordById,
  getRegisteredMeterCountByRecordId,
  getRegisteredMeterRecordIdsAfterDate,
} from "~/.server/db-queries/registeredMeters";

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
    processRegisteredMeters({
      ...formData,
      totalCount: formData.registeredCount,
    }),
  ]);

  await addMessageToLog(formData);
}

// async function processRegisteredMeters(formData: FormData) {
//   const { registeredCount } = formData;

//   if (registeredCount > 0) {
//     const currentRegisteredCount = await getRegisteredMeterCount({
//       balanceGroup: formData.balanceGroup,
//       date: formData.date,
//       substationId: formData.substationId,
//     });

//     if (currentRegisteredCount) {
//       await updateRegisteredMeterCount({
//         registeredMeterCount: formData.totalCount + currentRegisteredCount,
//         balanceGroup: formData.balanceGroup,
//         date: formData.date,
//         substationId: formData.substationId,
//       });
//     } else {
//       await createAccumulatedRegisteredRecord({
//         newRegisteredCount: formData.totalCount,
//         balanceGroup: formData.balanceGroup,
//         date: formData.date,
//         substationId: formData.substationId,
//       });
//     }

//     const futureRecordIds = await getRegisteredMeterRecordIdsAfterDate({
//       balanceGroup: formData.balanceGroup,
//       startDate: formData.date,
//       substationId: formData.substationId,
//     });

//     for (const id of futureRecordIds) {
//       const currentCount = await getRegisteredMeterCountByRecordId(id);

//       await updateRegisteredMeterRecordById({
//         id,
//         registeredMeterCount: currentCount + formData.totalCount,
//       });
//     }
//   }
// }

// interface AccumulatedRegisteredInput {
//   newRegisteredCount: number;
//   balanceGroup: BalanceGroup;
//   date: string;
//   substationId: number;
// }

// async function createAccumulatedRegisteredRecord({
//   newRegisteredCount,
//   balanceGroup,
//   date,
//   substationId,
// }: AccumulatedRegisteredInput) {
//   const currentRegisteredCount = await getRegisteredMeterCountAtDate({
//     balanceGroup,
//     targetDate: date,
//     dateComparison: "before",
//     substationId,
//   });

//   const totalRegistered = newRegisteredCount + currentRegisteredCount;

//   await createRegisteredMeterRecord({
//     registeredMeterCount: totalRegistered,
//     balanceGroup,
//     date,
//     substationId,
//   });
// }

async function addMessageToLog(formData: FormData) {
  const { totalCount, registeredCount, balanceGroup, substationId } = formData;

  const time = new Date().toLocaleString("ru");
  const message = `Добавлено: ${totalCount} ${registeredCount} ${balanceGroup} ${time}`;
  await insertMeterActionLog(message, substationId);
}
