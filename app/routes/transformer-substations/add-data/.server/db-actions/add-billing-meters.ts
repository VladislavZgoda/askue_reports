import {
  insertNewMeters,
  checkMetersRecord,
  updateMetersRecord,
  getNewMetersIds,
  getQuantityOnID,
  updateRecordOnId,
  getRegisteredMeterCountAtDate,
} from "~/.server/db-queries/registeredMeters";

import {
  insertYearlyMeterInstallation,
  updateYearlyMeterInstallation,
  getYearlyInstallationSummaryById,
  getYearlyMeterInstallationsStats,
  updateYearlyInstallationRecordById,
  getYearlyInstallationRecordsAfterDate,
  getYearlyInstallationSummaryBeforeCutoff,
} from "~/.server/db-queries/yearlyMeterInstallations";

import {
  updateMonthOnId,
  getMonthlyInstallationReport,
  getMonthlyInstallationSummary,
  insertMonthlyInstallationRecord,
  updateMonthlyInstallationRecord,
  getMonthlyInstallationSummaryById,
  getMonthlyInstallationRecordsAfterDate,
} from "~/.server/db-queries/monthlyMeterInstallations";

import {
  getNotInSystemIds,
  getNotInSystemOnID,
  updateNotInSystemOnId,
  insertUnregisteredMeters,
  updateUnregisteredMeters,
  getUnregisteredMeterCount,
  getUnregisteredMeterCountAtDate,
} from "~/.server/db-queries/unregisteredMeters";

import { insertMeterActionLog } from "~/.server/db-queries/meterActionLogs";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";
import type { BillingValidationForm } from "../../validation/billing-form-schema";

type FormData = BillingValidationForm & { readonly substationId: number };

export default async function addBillingMeters(formData: FormData) {
  const { totalCount, registeredCount } = formData;

  if (totalCount > registeredCount) {
    await handleNotInSystem(formData);
  }

  await Promise.all([
    handleYearMeters(formData),
    handleMonthMeters(formData),
    handleInsertNewMeters({
      ...formData,
      totalCount: formData.registeredCount,
    }),
  ]);

  await addMessageToLog(formData);
}

async function handleInsert(formData: FormData) {
  const lastQuantity = await getRegisteredMeterCountAtDate({
    balanceGroup: formData.balanceGroup,
    targetDate: formData.date,
    dateComparison: "before",
    transformerSubstationId: formData.substationId,
  });

  await insertNewMeters({
    registeredMeterCount: formData.totalCount + lastQuantity,
    balanceGroup: formData.balanceGroup,
    date: formData.date,
    transformerSubstationId: formData.substationId,
  });
}

async function handleUpdate(formData: FormData, prevMetersQuantity: number) {
  const updatedQuantity = formData.totalCount + prevMetersQuantity;

  await updateMetersRecord({
    registeredMeterCount: updatedQuantity,
    balanceGroup: formData.balanceGroup,
    date: formData.date,
    transformerSubstationId: formData.substationId,
  });
}

async function handleNotInSystem(formData: FormData) {
  const prevNotInSystem = await getUnregisteredMeterCount(formData);

  const { totalCount, registeredCount } = formData;
  const updatedQuantity = totalCount - registeredCount;

  if (typeof prevNotInSystem === "number") {
    await updateUnregisteredMeters({
      unregisteredMeterCount: updatedQuantity + prevNotInSystem,
      balanceGroup: formData.balanceGroup,
      date: formData.date,
      substationId: formData.substationId,
    });
  } else {
    await handleInsertNotInSystem({
      ...formData,
      totalCount: updatedQuantity,
    });
  }

  const ids = await getNotInSystemIds({
    balanceGroup: formData.balanceGroup,
    date: formData.date,
    transformerSubstationId: formData.substationId,
  });

  if (ids.length > 0) {
    for (const { id } of ids) {
      const quantity = await getNotInSystemOnID(id);

      await updateNotInSystemOnId({
        id,
        unregisteredMeterCount: quantity + updatedQuantity,
      });
    }
  }
}

async function handleInsertNewMeters(formData: FormData) {
  const { registeredCount } = formData;

  if (registeredCount > 0) {
    const prevMetersQuantity = await checkMetersRecord({
      balanceGroup: formData.balanceGroup,
      date: formData.date,
      transformerSubstationId: formData.substationId,
    });

    if (typeof prevMetersQuantity === "number") {
      await handleUpdate(formData, prevMetersQuantity);
    } else {
      await handleInsert(formData);
    }

    const ids = await getNewMetersIds({
      balanceGroup: formData.balanceGroup,
      date: formData.date,
      transformerSubstationId: formData.substationId,
    });

    if (ids.length > 0) {
      for (const { id } of ids) {
        const quantity = await getQuantityOnID(id);

        await updateRecordOnId({
          id,
          registeredMeterCount: quantity + formData.totalCount,
        });
      }
    }
  }
}

async function handleInsertNotInSystem(formData: FormData) {
  const lastQuantity = await getUnregisteredMeterCountAtDate({
    balanceGroup: formData.balanceGroup,
    targetDate: formData.date,
    dateComparison: "before",
    transformerSubstationId: formData.substationId,
  });

  const updatedQuantity = formData.totalCount + lastQuantity;

  await insertUnregisteredMeters({
    unregisteredMeterCount: updatedQuantity,
    balanceGroup: formData.balanceGroup,
    date: formData.date,
    substationId: formData.substationId,
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

  await insertYearlyMeterInstallation({
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
    for (const { id } of ids) {
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

  await insertMonthlyInstallationRecord({
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

      await updateMonthOnId({
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
