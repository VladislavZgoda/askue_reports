import {
  getLatestRegisteredMeterId,
  createRegisteredMeterRecord,
  updateRegisteredMeterRecordById,
} from "~/.server/db-queries/registeredMeters";
import {
  getLatestUnregisteredMeterId,
  createUnregisteredMeterRecord,
  updateUnregisteredMeterRecordById,
} from "~/.server/db-queries/unregisteredMeters";
import {
  getLatestYearlyInstallationId,
  createYearlyMeterInstallation,
  updateYearlyInstallationRecordById,
} from "~/.server/db-queries/yearlyMeterInstallations";
import {
  getLatestMonthlyInstallationId,
  createMonthlyInstallationRecord,
  updateMonthlyInstallationRecordById,
} from "~/.server/db-queries/monthlyMeterInstallations";
import { loadAllSubstationMeterReports } from "./load-data";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";

import type { BillingFormData } from "../../validation/billing-form.schema";

type BillingMetersParams = BillingFormData & { substationId: number };

export default async function upsertBillingMeters(
  params: BillingMetersParams,
): Promise<void> {
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

  const meterReport = existingStats[balanceGroup];

  await Promise.all([
    handleTotalMeters({
      totalCount,
      registeredCount,
      balanceGroup,
      substationId,
      date: currentDate,
      registeredMeterCount: meterReport.registeredMeters,
      unregisteredMeterCount: meterReport.unregisteredMeters,
    }),
    handleYearlyInstallation({
      yearlyTotalInstalled,
      yearlyRegisteredCount,
      balanceGroup,
      substationId,
      date: currentDate,
      year,
      yearlyInstallationStats: meterReport.yearlyInstallation,
    }),
    handleMonthlyInstallation({
      monthlyTotalInstalled,
      monthlyRegisteredCount,
      balanceGroup,
      substationId,
      date: currentDate,
      month,
      year,
      monthlyInstallationStats: meterReport.monthlyInstallation,
    }),
  ]);
}

interface TotalMetersParams {
  totalCount: number;
  registeredCount: number;
  substationId: number;
  balanceGroup: BalanceGroup;
  date: string;
  registeredMeterCount: number;
  unregisteredMeterCount: number;
}

async function handleTotalMeters(params: TotalMetersParams): Promise<void> {
  const {
    totalCount,
    registeredCount,
    substationId,
    balanceGroup,
    date,
    registeredMeterCount,
    unregisteredMeterCount,
  } = params;

  const [latestRegisteredMeterId, latestUnregisteredMeterId] =
    await Promise.all([
      getLatestRegisteredMeterId(balanceGroup, substationId),
      getLatestUnregisteredMeterId(balanceGroup, substationId),
    ]);

  await Promise.all([
    handleRegisteredMeters({
      latestRegisteredMeterId,
      registeredCount,
      registeredMeterCount,
      balanceGroup,
      date,
      substationId,
    }),
    handleUnregisteredMeters({
      latestUnregisteredMeterId,
      totalCount,
      registeredCount,
      unregisteredMeterCount,
      balanceGroup,
      date,
      substationId,
    }),
  ]);
}

type RegisteredMetersParams = Omit<
  TotalMetersParams,
  "totalCount" | "unregisteredMeterCount"
> & { latestRegisteredMeterId: number | undefined };

async function handleRegisteredMeters(
  params: RegisteredMetersParams,
): Promise<void> {
  const {
    latestRegisteredMeterId,
    registeredCount,
    registeredMeterCount,
    balanceGroup,
    date,
    substationId,
  } = params;

  if (latestRegisteredMeterId) {
    if (registeredMeterCount !== registeredCount) {
      await updateRegisteredMeterRecordById({
        id: latestRegisteredMeterId,
        registeredMeterCount: registeredCount,
      });
    }
  } else {
    await createRegisteredMeterRecord({
      registeredMeterCount: registeredCount,
      balanceGroup,
      date,
      substationId,
    });
  }
}

type UnregisteredMetersParams = Omit<
  TotalMetersParams,
  "registeredMeterCount"
> & { latestUnregisteredMeterId: number | undefined };

async function handleUnregisteredMeters(
  params: UnregisteredMetersParams,
): Promise<void> {
  const {
    latestUnregisteredMeterId,
    totalCount,
    registeredCount,
    unregisteredMeterCount,
    balanceGroup,
    date,
    substationId,
  } = params;

  const newCount = totalCount - registeredCount;

  if (latestUnregisteredMeterId) {
    if (unregisteredMeterCount !== newCount) {
      await updateUnregisteredMeterRecordById({
        id: latestUnregisteredMeterId,
        unregisteredMeterCount: newCount,
      });
    }
  } else {
    await createUnregisteredMeterRecord({
      unregisteredMeterCount: newCount,
      date,
      balanceGroup,
      substationId,
    });
  }
}

interface YearlyInstallationParams {
  yearlyTotalInstalled: number;
  yearlyRegisteredCount: number;
  balanceGroup: BalanceGroup;
  substationId: number;
  date: string;
  year: number;
  yearlyInstallationStats: {
    totalInstalled: number;
    registeredCount: number;
  };
}

async function handleYearlyInstallation(
  params: YearlyInstallationParams,
): Promise<void> {
  const {
    yearlyTotalInstalled,
    yearlyRegisteredCount,
    yearlyInstallationStats,
    balanceGroup,
    substationId,
    date,
    year,
  } = params;

  const latestYearlyInstallationId = await getLatestYearlyInstallationId({
    balanceGroup,
    substationId,
    year,
  });

  if (latestYearlyInstallationId) {
    const valuesChanged =
      yearlyTotalInstalled !== yearlyInstallationStats.totalInstalled ||
      yearlyRegisteredCount !== yearlyInstallationStats.registeredCount;

    if (valuesChanged) {
      await updateYearlyInstallationRecordById({
        id: latestYearlyInstallationId,
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

interface MonthlyInstallationParams {
  monthlyTotalInstalled: number;
  monthlyRegisteredCount: number;
  balanceGroup: BalanceGroup;
  substationId: number;
  date: string;
  month: string;
  year: number;
  monthlyInstallationStats: {
    totalInstalled: number;
    registeredCount: number;
  };
}

async function handleMonthlyInstallation(
  params: MonthlyInstallationParams,
): Promise<void> {
  const {
    monthlyTotalInstalled,
    monthlyRegisteredCount,
    monthlyInstallationStats,
    balanceGroup,
    substationId,
    date,
    month,
    year,
  } = params;

  const latestMonthlyInstallationId = await getLatestMonthlyInstallationId({
    balanceGroup,
    substationId,
    month,
    year,
  });

  if (latestMonthlyInstallationId) {
    const valuesChanged =
      monthlyTotalInstalled !== monthlyInstallationStats.totalInstalled ||
      monthlyRegisteredCount !== monthlyInstallationStats.registeredCount;

    if (valuesChanged) {
      await updateMonthlyInstallationRecordById({
        id: latestMonthlyInstallationId,
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
