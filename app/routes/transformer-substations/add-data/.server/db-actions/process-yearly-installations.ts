import { cutOutYear } from "~/utils/date-functions";

import {
  createYearlyMeterInstallation,
  findYearlyMeterInstallationId,
  incrementFutureYearlyInstallations,
  getYearlyInstallationSummaryBeforeCutoff,
  incrementYearlyMeterInstallationCountsById,
} from "~/.server/db-queries/yearly-meter-installations";

interface YearlyInstallationData {
  readonly balanceGroup: BalanceGroup;
  readonly totalCount: number;
  readonly registeredCount: number;
  readonly date: string;
  readonly substationId: number;
}

/**
 * Atomically processes a yearly meter installation record.
 *
 * This function ensures data consistency by:
 *
 * 1. Updating or creating a yearly accumulation record
 * 2. Propagating installation counts to future records
 *
 * All operations are performed within the provided database transaction
 * context.
 *
 * @param executor - Database client or transaction executor
 * @param yearlyInstallation - Installation data to process
 * @throws {Error} If input validation fails (e.g., registeredCount >
 *   totalCount)
 * @throws {Error} If database operations fail
 */
export default async function processYearlyInstallations(
  executor: Executor,
  yearlyInstallation: YearlyInstallationData,
): Promise<void> {
  const { totalCount, registeredCount, balanceGroup, date, substationId } =
    yearlyInstallation;

  const year = cutOutYear(date);

  // 1. Check for existing record
  const existingRecordId = await findYearlyMeterInstallationId(executor, {
    balanceGroup,
    date,
    substationId,
    year,
  });

  // 2. Update existing or create new accumulation record
  if (existingRecordId) {
    await incrementYearlyMeterInstallationCountsById(executor, {
      recordId: existingRecordId,
      totalInstalled: totalCount,
      registeredCount,
    });
  } else {
    await createAccumulatedYearlyInstallation(
      executor,
      yearlyInstallation,
      year,
    );
  }

  // 3. Propagate counts to future records
  await incrementFutureYearlyInstallations(executor, {
    totalIncrement: totalCount,
    registeredIncrement: registeredCount,
    balanceGroup,
    minDate: date,
    substationId,
    year,
  });
}

/**
 * Creates a new yearly accumulation record when none exists
 *
 * Calculates accumulations based on previous records
 *
 * @param executor Database executor
 * @param installationData New installation data
 * @param targetYear Target year for accumulation
 */
async function createAccumulatedYearlyInstallation(
  executor: Executor,
  installationData: YearlyInstallationData,
  targetYear: number,
) {
  const currentYearSummary = await getYearlyInstallationSummaryBeforeCutoff(
    executor,
    {
      balanceGroup: installationData.balanceGroup,
      cutoffDate: installationData.date,
      substationId: installationData.substationId,
      year: targetYear,
    },
  );

  const accumulatedTotalInstallations =
    installationData.totalCount + currentYearSummary.totalInstalled;
  const accumulatedRegisteredMeters =
    installationData.registeredCount + currentYearSummary.registeredCount;

  await createYearlyMeterInstallation(executor, {
    totalInstalled: accumulatedTotalInstallations,
    registeredCount: accumulatedRegisteredMeters,
    balanceGroup: installationData.balanceGroup,
    date: installationData.date,
    substationId: installationData.substationId,
    year: targetYear,
  });
}
