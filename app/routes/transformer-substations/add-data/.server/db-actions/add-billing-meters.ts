import {
  getRegisteredMeterCount,
  updateRegisteredMeterCount,
  createRegisteredMeterRecord,
  getRegisteredMeterCountAtDate,
  updateRegisteredMeterRecordById,
  getRegisteredMeterCountByRecordId,
  getRegisteredMeterRecordIdsAfterDate,
} from "~/.server/db-queries/registeredMeters";

import {
  createYearlyMeterInstallation,
  updateYearlyMeterInstallation,
  getYearlyInstallationSummaryById,
  getYearlyMeterInstallationsStats,
  updateYearlyInstallationRecordById,
  getYearlyInstallationRecordsAfterDate,
  getYearlyInstallationSummaryBeforeCutoff,
} from "~/.server/db-queries/yearlyMeterInstallations";

import {
  getMonthlyInstallationReport,
  getMonthlyInstallationSummary,
  createMonthlyInstallationRecord,
  updateMonthlyInstallationRecord,
  getMonthlyInstallationSummaryById,
  updateMonthlyInstallationRecordById,
  getMonthlyInstallationRecordsAfterDate,
} from "~/.server/db-queries/monthlyMeterInstallations";

import {
  getUnregisteredMeterCount,
  createUnregisteredMeterRecord,
  getUnregisteredMeterCountAtDate,
  updateUnregisteredMeterRecordById,
  getUnregisteredMeterCountByRecordId,
  getUnregisteredMeterRecordIdsAfterDate,
  updateUnregisteredMeterRecordByCompositeKey,
} from "~/.server/db-queries/unregisteredMeters";

import { insertMeterActionLog } from "~/.server/db-queries/meterActionLogs";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";
import type { BillingValidationForm } from "../../validation/billing-form-schema";

type FormData = BillingValidationForm & { readonly substationId: number };

export default async function addBillingMeters(formData: FormData) {
  const { totalCount, registeredCount } = formData;

  if (totalCount > registeredCount) {
    await processUnregisteredMeters(formData);
  }

  await Promise.all([
    handleYearMeters(formData),
    handleMonthMeters(formData),
    processRegisteredMeters({
      ...formData,
      totalCount: formData.registeredCount,
    }),
  ]);

  await addMessageToLog(formData);
}

async function processUnregisteredMeters(formData: FormData) {
  const previousUnregistered = await getUnregisteredMeterCount(formData);

  const { totalCount, registeredCount } = formData;
  const newUnregisteredCount = totalCount - registeredCount;

  if (previousUnregistered) {
    await updateUnregisteredMeterRecordByCompositeKey({
      unregisteredMeterCount: newUnregisteredCount + previousUnregistered,
      balanceGroup: formData.balanceGroup,
      date: formData.date,
      substationId: formData.substationId,
    });
  } else {
    await createAccumulatedUnregisteredRecord({
      newUnregisteredCount,
      balanceGroup: formData.balanceGroup,
      date: formData.date,
      substationId: formData.substationId,
    });
  }

  const futureRecordIds = await getUnregisteredMeterRecordIdsAfterDate({
    balanceGroup: formData.balanceGroup,
    startDate: formData.date,
    substationId: formData.substationId,
  });

  for (const id of futureRecordIds) {
    const currentCount = await getUnregisteredMeterCountByRecordId(id);

    await updateUnregisteredMeterRecordById({
      id,
      unregisteredMeterCount: currentCount + newUnregisteredCount,
    });
  }
}

interface AccumulatedUnrecordedInput {
  newUnregisteredCount: number;
  balanceGroup: BalanceGroup;
  date: string;
  substationId: number;
}

async function createAccumulatedUnregisteredRecord({
  newUnregisteredCount,
  balanceGroup,
  date,
  substationId,
}: AccumulatedUnrecordedInput) {
  const previousUnregistered = await getUnregisteredMeterCountAtDate({
    balanceGroup: balanceGroup,
    targetDate: date,
    dateComparison: "before",
    substationId,
  });

  const accumulatedUnregistered = newUnregisteredCount + previousUnregistered;

  await createUnregisteredMeterRecord({
    unregisteredMeterCount: accumulatedUnregistered,
    balanceGroup: balanceGroup,
    date: date,
    substationId: substationId,
  });
}

async function processRegisteredMeters(formData: FormData) {
  const { registeredCount } = formData;

  if (registeredCount > 0) {
    const currentRegisteredCount = await getRegisteredMeterCount({
      balanceGroup: formData.balanceGroup,
      date: formData.date,
      substationId: formData.substationId,
    });

    if (currentRegisteredCount) {
      await updateRegisteredMeterCount({
        registeredMeterCount: formData.totalCount + currentRegisteredCount,
        balanceGroup: formData.balanceGroup,
        date: formData.date,
        substationId: formData.substationId,
      });
    } else {
      await createAccumulatedRegisteredRecord({
        newRegisteredCount: formData.totalCount,
        balanceGroup: formData.balanceGroup,
        date: formData.date,
        substationId: formData.substationId,
      });
    }

    const futureRecordIds = await getRegisteredMeterRecordIdsAfterDate({
      balanceGroup: formData.balanceGroup,
      startDate: formData.date,
      substationId: formData.substationId,
    });

    for (const id of futureRecordIds) {
      const currentCount = await getRegisteredMeterCountByRecordId(id);

      await updateRegisteredMeterRecordById({
        id,
        registeredMeterCount: currentCount + formData.totalCount,
      });
    }
  }
}

interface AccumulatedRegisteredInput {
  newRegisteredCount: number;
  balanceGroup: BalanceGroup;
  date: string;
  substationId: number;
}

async function createAccumulatedRegisteredRecord({
  newRegisteredCount,
  balanceGroup,
  date,
  substationId,
}: AccumulatedRegisteredInput) {
  const currentRegisteredCount = await getRegisteredMeterCountAtDate({
    balanceGroup,
    targetDate: date,
    dateComparison: "before",
    substationId,
  });

  const totalRegistered = newRegisteredCount + currentRegisteredCount;

  await createRegisteredMeterRecord({
    registeredMeterCount: totalRegistered,
    balanceGroup,
    date,
    substationId,
  });
}

async function handleYearMeters(formData: FormData) {
  const year = cutOutYear(formData.date);

  const prevYearQuantity = await getYearlyMeterInstallationsStats({
    ...formData,
    year,
  });

  if (prevYearQuantity) {
    await updateTotalYearMeters(formData, prevYearQuantity, year);
  } else {
    await insertTotalYearMeters(formData, year);
  }

  await updateNextYearRecords({
    ...formData,
    year,
  });
}

async function insertTotalYearMeters(formData: FormData, year: number) {
  const lastYearQuantity = await getYearlyInstallationSummaryBeforeCutoff({
    balanceGroup: formData.balanceGroup,
    cutoffDate: formData.date,
    substationId: formData.substationId,
    year,
  });

  const updatedTotalInstalled =
    formData.totalCount + lastYearQuantity.totalInstalled;

  const updatedRegisteredCount =
    formData.registeredCount + lastYearQuantity.registeredCount;

  await createYearlyMeterInstallation({
    totalInstalled: updatedTotalInstalled,
    registeredCount: updatedRegisteredCount,
    balanceGroup: formData.balanceGroup,
    date: formData.date,
    substationId: formData.substationId,
    year,
  });
}

type YearlyMeterCount = Awaited<
  ReturnType<typeof getYearlyMeterInstallationsStats>
>;

async function updateTotalYearMeters(
  formData: FormData,
  prevYearQuantity: NonNullable<YearlyMeterCount>,
  year: number,
) {
  const updatedYearQuantity =
    formData.totalCount + prevYearQuantity.totalInstalled;

  const updatedAddedToSystem =
    formData.registeredCount + prevYearQuantity.registeredCount;

  await updateYearlyMeterInstallation({
    totalInstalled: updatedYearQuantity,
    registeredCount: updatedAddedToSystem,
    balanceGroup: formData.balanceGroup,
    substationId: formData.substationId,
    date: formData.date,
    year,
  });
}

type YearRecords = FormData & { readonly year: number };

async function updateNextYearRecords(params: YearRecords) {
  const ids = await getYearlyInstallationRecordsAfterDate({
    balanceGroup: params.balanceGroup,
    startDate: params.date,
    substationId: params.substationId,
    year: params.year,
  });

  if (ids.length > 0) {
    for (const id of ids) {
      const meters = await getYearlyInstallationSummaryById(id);

      await updateYearlyInstallationRecordById({
        id,
        totalInstalled: meters.totalInstalled + params.totalCount,
        registeredCount: meters.registeredCount + params.registeredCount,
      });
    }
  }
}

async function handleMonthMeters(formData: FormData) {
  const year = cutOutYear(formData.date);
  const month = cutOutMonth(formData.date);

  const prevMonthQuantity = await getMonthlyInstallationSummary({
    balanceGroup: formData.balanceGroup,
    date: formData.date,
    substationId: formData.substationId,
    month,
    year,
  });

  if (prevMonthQuantity) {
    await updateTotalMonthMeters(formData, prevMonthQuantity, month, year);
  } else {
    await insertTotalMonthMeters(formData, month, year);
  }

  await updateNextMonthRecords({
    ...formData,
    month,
    year,
  });
}

async function insertTotalMonthMeters(
  formData: FormData,
  month: string,
  year: number,
) {
  const lastMonthQuantity = await getMonthlyInstallationReport({
    balanceGroup: formData.balanceGroup,
    cutoffDate: formData.date,
    substationId: formData.substationId,
    month,
    year,
  });

  const updatedLastMonthQuantity =
    formData.totalCount + lastMonthQuantity.totalInstalled;

  const updatedLastMonthAddedToSystem =
    formData.registeredCount + lastMonthQuantity.registeredCount;

  await createMonthlyInstallationRecord({
    totalInstalled: updatedLastMonthQuantity,
    registeredCount: updatedLastMonthAddedToSystem,
    balanceGroup: formData.balanceGroup,
    date: formData.date,
    substationId: formData.substationId,
    month,
    year,
  });
}

type PreviousMonthlyMeterInstallations = NonNullable<
  Awaited<ReturnType<typeof getMonthlyInstallationSummary>>
>;

async function updateTotalMonthMeters(
  formData: FormData,
  prevMonthQuantity: PreviousMonthlyMeterInstallations,
  month: string,
  year: number,
) {
  const updatedMonthQuantity =
    formData.totalCount + prevMonthQuantity.totalInstalled;

  const updatedMonthAddedToSystem =
    formData.registeredCount + prevMonthQuantity.registeredCount;

  await updateMonthlyInstallationRecord({
    totalInstalled: updatedMonthQuantity,
    registeredCount: updatedMonthAddedToSystem,
    balanceGroup: formData.balanceGroup,
    date: formData.date,
    substationId: formData.substationId,
    month,
    year,
  });
}

type MonthRecords = YearRecords & { readonly month: string };

async function updateNextMonthRecords(params: MonthRecords) {
  const ids = await getMonthlyInstallationRecordsAfterDate({
    balanceGroup: params.balanceGroup,
    startDate: params.date,
    substationId: params.substationId,
    month: params.month,
    year: params.year,
  });

  if (ids.length > 0) {
    for (const { id } of ids) {
      const meters = await getMonthlyInstallationSummaryById(id);

      await updateMonthlyInstallationRecordById({
        id,
        totalInstalled: meters.totalInstalled + params.totalCount,
        registeredCount: meters.registeredCount + params.registeredCount,
      });
    }
  }
}

async function addMessageToLog(formData: FormData) {
  const { totalCount, registeredCount, balanceGroup, substationId } = formData;

  const time = new Date().toLocaleString("ru");
  const message = `Добавлено: ${totalCount} ${registeredCount} ${balanceGroup} ${time}`;
  await insertMeterActionLog(message, substationId);
}
