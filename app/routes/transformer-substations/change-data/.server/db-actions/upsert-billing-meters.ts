import {
  getLatestRegisteredMeterId,
  createRegisteredMeterRecord,
  updateRegisteredMeterRecordById,
} from "~/.server/db-queries/registered-meters";

import {
  getLatestUnregisteredMeterId,
  createUnregisteredMeterRecord,
  updateUnregisteredMeterRecordById,
} from "~/.server/db-queries/unregistered-meters";

import {
  getLatestYearlyInstallationId,
  createYearlyMeterInstallation,
  updateYearlyInstallationRecordById,
} from "~/.server/db-queries/yearly-meter-installations";

import {
  getLatestMonthlyInstallationId,
  createMonthlyInstallationRecord,
  updateMonthlyInstallationRecordById,
} from "~/.server/db-queries/monthly-meter-installations";

import { db } from "~/.server/db";
import { getBatchedSubstationMeterReports } from "~/.server/db-queries/transformer-substations";
import { cutOutMonth, cutOutYear } from "~/utils/dateFunctions";

import type { BillingFormData } from "../../validation/billing-form.schema";

type BillingMetersParams = BillingFormData & { substationId: number };

/**
 * Coordinates atomic upsert of all billing meter records
 *
 * @remarks
 * Performs in a single transaction:
 * 1. Upserts registered/unregistered meter aggregates
 * 2. Upserts yearly installation records
 * 3. Upserts monthly installation records
 *
 * Only updates records when values actually change
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
      upsertMeterAggregates(tx, {
        totalCount,
        registeredCount,
        balanceGroup,
        substationId,
        date: currentDate,
        existingRegistered: meterReport.registeredMeters,
        existingUnregistered: meterReport.unregisteredMeters,
      }),
      upsertYearlyInstallationRecord(tx, {
        newTotal: yearlyTotalInstalled,
        newRegistered: yearlyRegisteredCount,
        balanceGroup,
        substationId,
        date: currentDate,
        year,
        existingStats: meterReport.yearlyInstallation,
      }),
      upsertMonthlyInstallationRecord(tx, {
        newTotal: monthlyTotalInstalled,
        newRegistered: monthlyRegisteredCount,
        balanceGroup,
        substationId,
        date: currentDate,
        month,
        year,
        existingStats: meterReport.monthlyInstallation,
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
  existingRegistered: number;
  existingUnregistered: number;
}

/**
 * Coordinates upsert of registered and unregistered meter aggregates
 *
 * @param executor - Database executor
 * @param params - Aggregate parameters
 */
async function upsertMeterAggregates(
  executor: Executor,
  params: MeterAggregateParams,
): Promise<void> {
  const {
    totalCount,
    registeredCount,
    substationId,
    balanceGroup,
    date,
    existingRegistered,
    existingUnregistered,
  } = params;

  const [latestRegisteredMeterId, latestUnregisteredMeterId] =
    await Promise.all([
      getLatestRegisteredMeterId(executor, balanceGroup, substationId),
      getLatestUnregisteredMeterId(executor, balanceGroup, substationId),
    ]);

  await Promise.all([
    upsertRegisteredMeterRecord(executor, {
      latestRecordId: latestRegisteredMeterId,
      newCount: registeredCount,
      existingCount: existingRegistered,
      balanceGroup,
      date,
      substationId,
    }),
    upsertUnregisteredMeterRecord(executor, {
      latestRecordId: latestUnregisteredMeterId,
      totalCount,
      registeredCount,
      existingUnregistered,
      balanceGroup,
      date,
      substationId,
    }),
  ]);
}

interface RegisteredMeterUpsertParams {
  latestRecordId: number | undefined;
  newCount: number;
  existingCount: number;
  balanceGroup: BalanceGroup;
  date: string;
  substationId: number;
}

/**
 * Upserts registered meter record
 *
 * @param executor - Database executor
 * @param params - Upsert parameters
 *
 * @note Only updates if newCount differs from existingCount
 */
async function upsertRegisteredMeterRecord(
  executor: Executor,
  params: RegisteredMeterUpsertParams,
): Promise<void> {
  const {
    latestRecordId,
    newCount,
    existingCount,
    balanceGroup,
    date,
    substationId,
  } = params;

  if (latestRecordId) {
    if (existingCount !== newCount) {
      await updateRegisteredMeterRecordById(executor, {
        id: latestRecordId,
        registeredMeterCount: newCount,
      });
    }
  } else {
    await createRegisteredMeterRecord(executor, {
      registeredMeterCount: newCount,
      balanceGroup,
      date,
      substationId,
    });
  }
}

interface UnregisteredMeterUpsertParams {
  latestRecordId: number | undefined;
  totalCount: number;
  registeredCount: number;
  existingUnregistered: number;
  balanceGroup: BalanceGroup;
  date: string;
  substationId: number;
}

/**
 * Upserts unregistered meter record
 *
 * @param executor - Database executor
 * @param params - Upsert parameters
 *
 * @note Calculates new unregistered count as (totalCount - registeredCount)
 */
async function upsertUnregisteredMeterRecord(
  executor: Executor,
  params: UnregisteredMeterUpsertParams,
): Promise<void> {
  const {
    latestRecordId,
    totalCount,
    registeredCount,
    existingUnregistered,
    balanceGroup,
    date,
    substationId,
  } = params;

  const newUnregistered = totalCount - registeredCount;

  if (latestRecordId) {
    if (existingUnregistered !== newUnregistered) {
      await updateUnregisteredMeterRecordById(executor, {
        id: latestRecordId,
        unregisteredMeterCount: newUnregistered,
      });
    }
  } else {
    await createUnregisteredMeterRecord(executor, {
      unregisteredMeterCount: newUnregistered,
      date,
      balanceGroup,
      substationId,
    });
  }
}

interface YearlyInstallationUpsertParams {
  newTotal: number;
  newRegistered: number;
  balanceGroup: BalanceGroup;
  substationId: number;
  date: string;
  year: number;
  existingStats: {
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
 * @note Only updates if values changed
 */
async function upsertYearlyInstallationRecord(
  executor: Executor,
  params: YearlyInstallationUpsertParams,
): Promise<void> {
  const {
    newTotal,
    newRegistered,
    existingStats,
    balanceGroup,
    substationId,
    date,
    year,
  } = params;

  const latestRecordId = await getLatestYearlyInstallationId(executor, {
    balanceGroup,
    substationId,
    year,
  });

  if (latestRecordId) {
    const valuesChanged =
      newTotal !== existingStats.totalInstalled ||
      newRegistered !== existingStats.registeredCount;

    if (valuesChanged) {
      await updateYearlyInstallationRecordById(executor, {
        id: latestRecordId,
        totalInstalled: newTotal,
        registeredCount: newRegistered,
      });
    }
  } else {
    await createYearlyMeterInstallation(executor, {
      totalInstalled: newTotal,
      registeredCount: newRegistered,
      substationId,
      date,
      balanceGroup,
      year,
    });
  }
}

interface MonthlyInstallationUpsertParams {
  newTotal: number;
  newRegistered: number;
  balanceGroup: BalanceGroup;
  substationId: number;
  date: string;
  month: string;
  year: number;
  existingStats: {
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
 * @note Only updates if values changed
 */
async function upsertMonthlyInstallationRecord(
  executor: Executor,
  params: MonthlyInstallationUpsertParams,
): Promise<void> {
  const {
    newTotal,
    newRegistered,
    existingStats,
    balanceGroup,
    substationId,
    date,
    month,
    year,
  } = params;

  const latestRecordId = await getLatestMonthlyInstallationId(executor, {
    balanceGroup,
    substationId,
    month,
    year,
  });

  if (latestRecordId) {
    const valuesChanged =
      newTotal !== existingStats.totalInstalled ||
      newRegistered !== existingStats.registeredCount;

    if (valuesChanged) {
      await updateMonthlyInstallationRecordById(executor, {
        id: latestRecordId,
        totalInstalled: newTotal,
        registeredCount: newRegistered,
      });
    }
  } else {
    await createMonthlyInstallationRecord(executor, {
      totalInstalled: newTotal,
      registeredCount: newRegistered,
      balanceGroup,
      substationId,
      date,
      month,
      year,
    });
  }
}
