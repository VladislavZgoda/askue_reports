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
    handleYearMeters(
      {
        yearlyTotalInstalled,
        yearlyRegisteredCount,
        balanceGroup,
        substationId,
        date: currentDate,
        year,
      },
      meterReport,
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
      meterReport,
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

interface TotalMetersParams {
  totalCount: number;
  registeredCount: number;
  substationId: number;
  balanceGroup: BalanceGroup;
  date: string;
  registeredMeterCount: number;
  unregisteredMeterCount: number;
}

async function handleTotalMeters(params: TotalMetersParams) {
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

async function handleRegisteredMeters(params: RegisteredMetersParams) {
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

async function handleUnregisteredMeters(params: UnregisteredMetersParams) {
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
