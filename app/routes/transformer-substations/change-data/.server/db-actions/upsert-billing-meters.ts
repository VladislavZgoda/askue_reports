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

import { db } from "~/.server/db";
import { getBatchedSubstationMeterReports } from "~/.server/db-queries/transformerSubstations";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";

import type { BillingFormData } from "../../validation/billing-form.schema";

type BillingMetersParams = BillingFormData & { substationId: number };

/**
 * Upserts billing meter records across multiple domains
 *
 * @remarks
 * Performs atomic updates for:
 * - Registered/unregistered meter aggregates
 * - Yearly installations
 * - Monthly installations
 *
 * Runs in a single database transaction for consistency
 *
 * @param params - Billing meter data
 *   @param params.totalCount - Total meters installed
 *   @param params.registeredCount - Meters registered in system
 *   @param params.yearlyTotalInstalled - Yearly installed meters
 *   @param params.yearlyRegisteredCount - Yearly registered meters
 *   @param params.monthlyTotalInstalled - Monthly installed meters
 *   @param params.monthlyRegisteredCount - Monthly registered meters
 *   @param params.balanceGroup - Balance group category
 *   @param params.substationId - Associated substation ID
 *
 * @example
 * await upsertBillingMeterRecords({
 *   substationId: 42,
 *   balanceGroup: 'ЮР П2',
 *   totalCount: 15,
 *   registeredCount: 12,
 *   // ... other params
 * });
 */
export default async function upsertBillingMeterRecords(
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

  await db.transaction(async (tx) => {
    const existingStats = await getBatchedSubstationMeterReports(tx, {
      substationId,
      targetYear: year,
      targetMonth: month,
      balanceGroups: [balanceGroup],
    });

    const meterReport = existingStats[balanceGroup];

    await Promise.all([
      handleMeterAggregates(tx, {
        totalCount,
        registeredCount,
        balanceGroup,
        substationId,
        date: currentDate,
        registeredMeterCount: meterReport.registeredMeters,
        unregisteredMeterCount: meterReport.unregisteredMeters,
      }),
      upsertYearlyInstallationRecord(tx, {
        yearlyTotalInstalled,
        yearlyRegisteredCount,
        balanceGroup,
        substationId,
        date: currentDate,
        year,
        yearlyInstallationStats: meterReport.yearlyInstallation,
      }),
      upsertMonthlyInstallationRecord(tx, {
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
  });
}

interface MeterAggregateParams {
  totalCount: number;
  registeredCount: number;
  substationId: number;
  balanceGroup: BalanceGroup;
  date: string;
  registeredMeterCount: number;
  unregisteredMeterCount: number;
}

/**
 * Coordinates upsert of registered and unregistered meter aggregates
 *
 * @param executor - Database executor
 * @param params - Aggregate parameters
 */
async function handleMeterAggregates(
  executor: Executor,
  params: MeterAggregateParams,
): Promise<void> {
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
      getLatestRegisteredMeterId(executor, balanceGroup, substationId),
      getLatestUnregisteredMeterId(executor, balanceGroup, substationId),
    ]);

  await Promise.all([
    upsertRegisteredMeterRecord(executor, {
      latestRegisteredMeterId,
      registeredCount,
      registeredMeterCount,
      balanceGroup,
      date,
      substationId,
    }),
    upsertUnregisteredMeterRecord(executor, {
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
  MeterAggregateParams,
  "totalCount" | "unregisteredMeterCount"
> & { latestRegisteredMeterId: number | undefined };

/**
 * Upserts registered meter record
 *
 * @param executor - Database executor
 * @param params - Upsert parameters
 *
 * @note Only updates if newCount differs from registeredMeterCount
 */
async function upsertRegisteredMeterRecord(
  executor: Executor,
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
      await updateRegisteredMeterRecordById(executor, {
        id: latestRegisteredMeterId,
        registeredMeterCount: registeredCount,
      });
    }
  } else {
    await createRegisteredMeterRecord(executor, {
      registeredMeterCount: registeredCount,
      balanceGroup,
      date,
      substationId,
    });
  }
}

type UnregisteredMetersParams = Omit<
  MeterAggregateParams,
  "registeredMeterCount"
> & { latestUnregisteredMeterId: number | undefined };

/**
 * Upserts unregistered meter record
 *
 * @param executor - Database executor
 * @param params - Upsert parameters
 *
 * @note Only updates if newCount differs from unregisteredMeterCount
 */
async function upsertUnregisteredMeterRecord(
  executor: Executor,
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
      await updateUnregisteredMeterRecordById(executor, {
        id: latestUnregisteredMeterId,
        unregisteredMeterCount: newCount,
      });
    }
  } else {
    await createUnregisteredMeterRecord(executor, {
      unregisteredMeterCount: newCount,
      date,
      balanceGroup,
      substationId,
    });
  }
}

interface YearlyInstallationUpsertParams {
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

/**
 * Upserts yearly installation record
 *
 * @param executor - Database executor
 * @param params - Upsert parameters
 *
 * @note Only updates if yearlyTotalInstalled or yearlyRegisteredCount differs from yearlyInstallationStats
 */
async function upsertYearlyInstallationRecord(
  executor: Executor,
  params: YearlyInstallationUpsertParams,
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

  const latestYearlyInstallationId = await getLatestYearlyInstallationId(
    executor,
    {
      balanceGroup,
      substationId,
      year,
    },
  );

  if (latestYearlyInstallationId) {
    const valuesChanged =
      yearlyTotalInstalled !== yearlyInstallationStats.totalInstalled ||
      yearlyRegisteredCount !== yearlyInstallationStats.registeredCount;

    if (valuesChanged) {
      await updateYearlyInstallationRecordById(executor, {
        id: latestYearlyInstallationId,
        totalInstalled: yearlyTotalInstalled,
        registeredCount: yearlyRegisteredCount,
      });
    }
  } else {
    await createYearlyMeterInstallation(executor, {
      totalInstalled: yearlyTotalInstalled,
      registeredCount: yearlyRegisteredCount,
      substationId,
      date,
      balanceGroup,
      year,
    });
  }
}

interface MonthlyInstallationUpsertParams {
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

/**
 * Upserts monthly installation record
 *
 * @param executor - Database executor
 * @param params - Upsert parameters
 *
 * @note Only updates if monthlyTotalInstalled or monthlyRegisteredCount differs from monthlyInstallationStats
 */
async function upsertMonthlyInstallationRecord(
  executor: Executor,
  params: MonthlyInstallationUpsertParams,
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

  const latestMonthlyInstallationId = await getLatestMonthlyInstallationId(
    executor,
    {
      balanceGroup,
      substationId,
      month,
      year,
    },
  );

  if (latestMonthlyInstallationId) {
    const valuesChanged =
      monthlyTotalInstalled !== monthlyInstallationStats.totalInstalled ||
      monthlyRegisteredCount !== monthlyInstallationStats.registeredCount;

    if (valuesChanged) {
      await updateMonthlyInstallationRecordById(executor, {
        id: latestMonthlyInstallationId,
        totalInstalled: monthlyTotalInstalled,
        registeredCount: monthlyRegisteredCount,
      });
    }
  } else {
    await createMonthlyInstallationRecord(executor, {
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
