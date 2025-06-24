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
  insertYearMeters,
  selectYearQuantity,
  updateYearMeters,
  getYearIds,
  getYearMetersOnID,
  updateYearOnId,
  getYearlyMeterInstallationSummary,
} from "~/.server/db-queries/yearlyMeterInstallations";

import {
  insertMonthMeters,
  updateMonthMeters,
  selectMonthQuantity,
  getMonthIds,
  getMonthMetersOnID,
  updateMonthOnId,
  getMonthlyMeterInstallationSummary,
} from "~/.server/db-queries/monthlyMeterInstallations";

import {
  insertNotInSystem,
  updateNotInSystem,
  checkNotInSystem,
  getNotInSystemIds,
  getNotInSystemOnID,
  updateNotInSystemOnId,
  getUnregisteredMeterCountAtDate,
} from "~/.server/db-queries/unregisteredMeters";

import { insertMessage } from "~/.server/db-queries/meterActionLogs";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";
import type { BillingValidationForm } from "../../validation/billingFormSchema";

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
  const prevNotInSystem = await checkNotInSystem({
    date: formData.date,
    balanceGroup: formData.balanceGroup,
    transformerSubstationId: formData.substationId,
  });

  const { totalCount, registeredCount } = formData;
  const updatedQuantity = totalCount - registeredCount;

  if (typeof prevNotInSystem === "number") {
    await updateNotInSystem({
      unregisteredMeterCount: updatedQuantity + prevNotInSystem,
      balanceGroup: formData.balanceGroup,
      date: formData.date,
      transformerSubstationId: formData.substationId,
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

  await insertNotInSystem({
    unregisteredMeterCount: updatedQuantity,
    balanceGroup: formData.balanceGroup,
    date: formData.date,
    transformerSubstationId: formData.substationId,
  });
}

async function handleYearMeters(formData: FormData) {
  const { balanceGroup, date, substationId } = formData;
  const year = cutOutYear(date);

  const prevYearQuantity = await selectYearQuantity({
    balanceGroup,
    date,
    transformerSubstationId: substationId,
    year,
  });

  if (prevYearQuantity[0]?.totalInstalled !== undefined) {
    await updateTotalYearMeters(formData, prevYearQuantity[0], year);
  } else {
    await insertTotalYearMeters(formData, year);
  }

  await updateNextYearRecords({
    ...formData,
    year,
  });
}

async function insertTotalYearMeters(formData: FormData, year: number) {
  const lastYearQuantity = await getYearlyMeterInstallationSummary({
    balanceGroup: formData.balanceGroup,
    targetDate: formData.date,
    dateComparison: "before",
    transformerSubstationId: formData.substationId,
    year,
  });

  const updatedTotalInstalled =
    formData.totalCount + lastYearQuantity.totalInstalled;

  const updatedRegisteredCount =
    formData.registeredCount + lastYearQuantity.registeredCount;

  await insertYearMeters({
    totalInstalled: updatedTotalInstalled,
    registeredCount: updatedRegisteredCount,
    balanceGroup: formData.balanceGroup,
    date: formData.date,
    transformerSubstationId: formData.substationId,
    year,
  });
}

type YearlyMeterCount = Awaited<ReturnType<typeof selectYearQuantity>>[number];

async function updateTotalYearMeters(
  formData: FormData,
  prevYearQuantity: YearlyMeterCount,
  year: number,
) {
  const updatedYearQuantity =
    formData.totalCount + prevYearQuantity.totalInstalled;

  const updatedAddedToSystem =
    formData.registeredCount + prevYearQuantity.registeredCount;

  await updateYearMeters({
    totalInstalled: updatedYearQuantity,
    registeredCount: updatedAddedToSystem,
    balanceGroup: formData.balanceGroup,
    transformerSubstationId: formData.substationId,
    date: formData.date,
    year,
  });
}

type YearRecords = FormData & { readonly year: number };

async function updateNextYearRecords(params: YearRecords) {
  const ids = await getYearIds({
    balanceGroup: params.balanceGroup,
    date: params.date,
    transformerSubstationId: params.substationId,
    year: params.year,
  });

  if (ids.length > 0) {
    for (const { id } of ids) {
      const meters = await getYearMetersOnID(id);

      await updateYearOnId({
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

  const prevMonthQuantity = await selectMonthQuantity({
    balanceGroup: formData.balanceGroup,
    date: formData.date,
    transformerSubstationId: formData.substationId,
    month,
    year,
  });

  if (prevMonthQuantity[0]?.totalInstalled !== undefined) {
    await updateTotalMonthMeters(formData, prevMonthQuantity[0], month, year);
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
  const lastMonthQuantity = await getMonthlyMeterInstallationSummary({
    balanceGroup: formData.balanceGroup,
    targetDate: formData.date,
    dateComparison: "before",
    transformerSubstationId: formData.substationId,
    month,
    year,
  });

  const updatedLastMonthQuantity =
    formData.totalCount + lastMonthQuantity.totalInstalled;

  const updatedLastMonthAddedToSystem =
    formData.registeredCount + lastMonthQuantity.registeredCount;

  await insertMonthMeters({
    totalInstalled: updatedLastMonthQuantity,
    registeredCount: updatedLastMonthAddedToSystem,
    balanceGroup: formData.balanceGroup,
    date: formData.date,
    transformerSubstationId: formData.substationId,
    month,
    year,
  });
}

type PreviousMonthlyMeterInstallations = Awaited<
  ReturnType<typeof selectMonthQuantity>
>[number];

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

  await updateMonthMeters({
    totalInstalled: updatedMonthQuantity,
    registeredCount: updatedMonthAddedToSystem,
    balanceGroup: formData.balanceGroup,
    date: formData.date,
    transformerSubstationId: formData.substationId,
    month,
    year,
  });
}

type MonthRecords = YearRecords & { readonly month: string };

async function updateNextMonthRecords(params: MonthRecords) {
  const ids = await getMonthIds({
    balanceGroup: params.balanceGroup,
    date: params.date,
    transformerSubstationId: params.substationId,
    month: params.month,
    year: params.year,
  });

  if (ids.length > 0) {
    for (const { id } of ids) {
      const meters = await getMonthMetersOnID(id);

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
  await insertMessage(message, substationId);
}
