import {
  getLatestRegisteredMeterId,
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

type BillingMetersParams = BillingFormData & { substationId: number };

export default async function changeData(params: BillingMetersParams) {
  const {
    totalCount,
    registeredCount,
    yearlyTotalInstalled,
    yearlyRegisteredCount,
    monthlyTotalInstalled,
    monthlyRegisteredCount,
    balanceGroup,
    substationId,
  } = params;

  const currentDate = new Date().toLocaleDateString("en-CA");
  const year = cutOutYear(currentDate);
  const month = cutOutMonth(currentDate);

  const existingStats = await loadAllSubstationMeterReports(substationId, [
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
      existingStats[balanceGroup],
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
      existingStats[balanceGroup],
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
      existingStats[balanceGroup],
    ),
  ]);
}

interface MeterReport {
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
  existingStats: MeterReport,
) {
  const [lastMetersQuantityId, lastNotInSystemId] = await Promise.all([
    getLatestRegisteredMeterId(input.balanceGroup, input.substationId),
    getLastNotInSystemId({
      transformerSubstationId: input.substationId,
      balanceGroup: input.balanceGroup,
    }),
  ]);

  await Promise.all([
    handleMetersQuantity(lastMetersQuantityId, existingStats, input),
    handleNotInSystem(lastNotInSystemId, existingStats, input),
  ]);
}

async function handleMetersQuantity(
  lastMetersQuantityId: number | undefined,
  existingStats: MeterReport,
  { registeredCount, balanceGroup, substationId, date }: UpdateTotalMetersType,
) {
  if (lastMetersQuantityId) {
    if (!(existingStats.registeredMeters === registeredCount)) {
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
  existingStats: MeterReport,
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
    if (!(existingStats.unregisteredMeters === actualQuantity)) {
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
  existingStats: MeterReport,
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
      yearlyTotalInstalled ===
        existingStats.yearlyInstallation.totalInstalled &&
      yearlyRegisteredCount ===
        existingStats.yearlyInstallation.registeredCount;

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
  existingStats: MeterReport,
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
        existingStats.monthlyInstallation.totalInstalled &&
      monthlyRegisteredCount ===
        existingStats.monthlyInstallation.registeredCount;

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
