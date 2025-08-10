import {
  getLastRecordId,
  createRegisteredMeterRecord,
  updateRegisteredMeterRecordById,
} from "~/.server/db-queries/registeredMeters";
import {
  getLastNotInSystemId,
  createUnregisteredMeterRecord,
  updateUnregisteredMeterRecordById,
} from "~/.server/db-queries/unregisteredMeters";
import {
  getLastYearId,
  createYearlyMeterInstallation,
  updateYearlyInstallationRecordById,
} from "~/.server/db-queries/yearlyMeterInstallations";
import {
  getLastMonthId,
  createMonthlyInstallationRecord,
  updateMonthlyInstallationRecordById,
} from "~/.server/db-queries/monthlyMeterInstallations";
import { loadAllSubstationMeterReports } from "./load-data";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";

import type { BillingFormData } from "../../validation/billing-form.schema";

type InputData = BillingFormData & { substationId: number };

export default async function changeData(input: InputData) {
  const {
    totalCount,
    registeredCount,
    yearlyTotalInstalled,
    yearlyRegisteredCount,
    monthlyTotalInstalled,
    monthlyRegisteredCount,
    balanceGroup,
    substationId,
  } = input;

  const currentDate = new Date().toLocaleDateString("en-CA");
  const year = cutOutYear(currentDate);
  const month = cutOutMonth(currentDate);

  const previousData = await loadAllSubstationMeterReports(substationId, [
    balanceGroup,
  ]);

  await Promise.all([
    handleTotalMeters(
      {
        totalCount,
        registeredCount,
        balanceGroup,
        substationId,
        date: currentDate,
      },
      previousData[balanceGroup],
    ),
    handleYearMeters(
      {
        yearlyTotalInstalled,
        yearlyRegisteredCount,
        balanceGroup,
        substationId,
        date: currentDate,
        year,
      },
      previousData[balanceGroup],
    ),
    handleMonthMeters(
      {
        monthlyTotalInstalled,
        monthlyRegisteredCount,
        balanceGroup,
        substationId,
        date: currentDate,
        month,
        year,
      },
      previousData[balanceGroup],
    ),
  ]);
}

interface PreviousData {
  registeredMeters: number;
  unregisteredMeters: number;
  yearlyInstallation: {
    totalInstalled: number;
    registeredCount: number;
  };
  monthlyInstallation: {
    totalInstalled: number;
    registeredCount: number;
  };
}

interface UpdateTotalMetersType {
  totalCount: number;
  registeredCount: number;
  substationId: number;
  balanceGroup: BalanceGroup;
  date: string;
}

async function handleTotalMeters(
  input: UpdateTotalMetersType,
  previousData: PreviousData,
) {
  const [lastMetersQuantityId, lastNotInSystemId] = await Promise.all([
    getLastRecordId({
      transformerSubstationId: input.substationId,
      balanceGroup: input.balanceGroup,
    }),
    getLastNotInSystemId({
      transformerSubstationId: input.substationId,
      balanceGroup: input.balanceGroup,
    }),
  ]);

  await Promise.all([
    handleMetersQuantity(lastMetersQuantityId, previousData, input),
    handleNotInSystem(lastNotInSystemId, previousData, input),
  ]);
}

async function handleMetersQuantity(
  lastMetersQuantityId: number | undefined,
  previousData: PreviousData,
  { registeredCount, balanceGroup, substationId, date }: UpdateTotalMetersType,
) {
  if (lastMetersQuantityId) {
    if (!(previousData.registeredMeters === registeredCount)) {
      await updateRegisteredMeterRecordById({
        id: lastMetersQuantityId,
        registeredMeterCount: registeredCount,
      });
    }
  } else {
    await createRegisteredMeterRecord({
      registeredMeterCount: registeredCount,
      substationId,
      date,
      balanceGroup,
    });
  }
}

async function handleNotInSystem(
  lastNotInSystemId: number | undefined,
  prevData: PreviousData,
  {
    totalCount,
    registeredCount,
    balanceGroup,
    substationId,
    date,
  }: UpdateTotalMetersType,
) {
  const actualQuantity = totalCount - registeredCount;

  if (lastNotInSystemId) {
    if (!(prevData.unregisteredMeters === actualQuantity)) {
      await updateUnregisteredMeterRecordById({
        id: lastNotInSystemId,
        unregisteredMeterCount: actualQuantity,
      });
    }
  } else {
    await createUnregisteredMeterRecord({
      substationId,
      unregisteredMeterCount: actualQuantity,
      date,
      balanceGroup,
    });
  }
}

interface UpdateTotalYearMetersType {
  yearlyTotalInstalled: number;
  yearlyRegisteredCount: number;
  balanceGroup: BalanceGroup;
  substationId: number;
  date: string;
  year: number;
}

async function handleYearMeters(
  input: UpdateTotalYearMetersType,
  previousData: PreviousData,
) {
  const {
    yearlyTotalInstalled,
    yearlyRegisteredCount,
    balanceGroup,
    substationId,
    date,
    year,
  } = input;

  const lastYearId = await getLastYearId({
    transformerSubstationId: substationId,
    balanceGroup,
    year,
  });

  if (lastYearId) {
    const isEqual =
      yearlyTotalInstalled === previousData.yearlyInstallation.totalInstalled &&
      yearlyRegisteredCount === previousData.yearlyInstallation.registeredCount;

    if (!isEqual) {
      await updateYearlyInstallationRecordById({
        id: lastYearId,
        totalInstalled: yearlyTotalInstalled,
        registeredCount: yearlyRegisteredCount,
      });
    }
  } else {
    await createYearlyMeterInstallation({
      totalInstalled: yearlyTotalInstalled,
      registeredCount: yearlyRegisteredCount,
      substationId,
      date,
      balanceGroup,
      year,
    });
  }
}

interface UpdateTotalMonthMetersType {
  monthlyTotalInstalled: number;
  monthlyRegisteredCount: number;
  balanceGroup: BalanceGroup;
  substationId: number;
  date: string;
  month: string;
  year: number;
}

async function handleMonthMeters(
  input: UpdateTotalMonthMetersType,
  previousData: PreviousData,
) {
  const {
    monthlyTotalInstalled,
    monthlyRegisteredCount,
    balanceGroup,
    substationId,
    date,
    month,
    year,
  } = input;

  const lastMonthId = await getLastMonthId({
    transformerSubstationId: substationId,
    balanceGroup,
    month,
    year,
  });

  if (lastMonthId) {
    const isEqual =
      monthlyTotalInstalled ===
        previousData.monthlyInstallation.totalInstalled &&
      monthlyRegisteredCount ===
        previousData.monthlyInstallation.registeredCount;

    if (!isEqual) {
      await updateMonthlyInstallationRecordById({
        id: lastMonthId,
        totalInstalled: monthlyTotalInstalled,
        registeredCount: monthlyRegisteredCount,
      });
    }
  } else {
    await createMonthlyInstallationRecord({
      totalInstalled: monthlyTotalInstalled,
      registeredCount: monthlyRegisteredCount,
      balanceGroup,
      substationId,
      date,
      month,
      year,
    });
  }
}
