import { db } from "../db";
import { transformerSubstations } from "../schema";
import { eq, ilike } from "drizzle-orm";
import composeSearchString from "~/utils/search-string";

interface TransformerSubstationData {
  id: number;
  name: string;
}

export async function createTransformerSubstation(
  name: string,
): Promise<TransformerSubstationData> {
  const result = await db
    .insert(transformerSubstations)
    .values({ name })
    .returning({
      id: transformerSubstations.id,
      name: transformerSubstations.name,
    });

  return result[0];
}

export async function isTransformerSubstationNameTaken(
  name: string,
): Promise<boolean> {
  const result = await db.query.transformerSubstations.findFirst({
    columns: { name: true },
    where: eq(transformerSubstations.name, name),
  });

  return !!result;
}

export async function searchTransformerSubstationsByName(
  nameFilter: string | null,
): Promise<TransformerSubstationData[]> {
  try {
    const searchString = composeSearchString(nameFilter);

    const result = await db.query.transformerSubstations.findMany({
      columns: {
        id: true,
        name: true,
      },
      where: ilike(transformerSubstations.name, searchString),
    });

    return result;
  } catch {
    throw new Error("DB is not available", {
      cause: "Cannot connect to db",
    });
  }
}

/**
 * Retrieves basic transformer substation details by ID
 *
 * @param id Substation ID to retrieve
 * @returns Object with {id, name} or undefined if not found
 */
export async function getTransformerSubstationById(id: number) {
  const result = await db.query.transformerSubstations.findFirst({
    columns: {
      id: true,
      name: true,
    },
    where: eq(transformerSubstations.id, id),
  });

  return result;
}

export async function deleteTransformerSubstation(id: number): Promise<void> {
  await db
    .delete(transformerSubstations)
    .where(eq(transformerSubstations.id, id));
}

export async function updateTransformerSubstation(
  id: number,
  name: string,
): Promise<void> {
  const updatedAt = new Date();

  await db
    .update(transformerSubstations)
    .set({ name, updatedAt })
    .where(eq(transformerSubstations.id, id));
}

interface SubstationMeterReportParams {
  balanceGroup: BalanceGroup;
  targetDate: string;
  month: string;
  year: number;
}

/**
 * Retrieves comprehensive meter reports for all substations as of a specific
 * date
 *
 * Report includes for each substation:
 *
 * - Current registered meter counts (latest before/on targetDate)
 * - Current unregistered meter counts (latest before/on targetDate)
 * - Yearly installation summary for specified year (latest before/on targetDate)
 * - Monthly installation summary for specified month/year (latest before/on
 *   targetDate)
 *
 * @param params Report parameters
 * @param params.balanceGroup Balance group to filter by
 * @param params.targetDate The "as-of" date for all reports (YYYY-MM-DD format)
 * @param params.month Target month for monthly installation data (MM format)
 * @param params.year Target year for yearly/monthly installation data
 * @returns Array of substations with their meter reports
 */
export async function getSubstationMeterReportsAtDate({
  balanceGroup,
  targetDate,
  month,
  year,
}: SubstationMeterReportParams) {
  const result = await db.query.transformerSubstations.findMany({
    columns: {
      id: true,
      name: true,
    },
    with: {
      meterCounts: {
        columns: {
          registeredCount: true,
          unregisteredCount: true,
        },
        where: (meterCounts, { eq, and, lte }) =>
          and(
            eq(meterCounts.balanceGroup, balanceGroup),
            lte(meterCounts.date, targetDate),
          ),
        orderBy: (meterCounts, { desc }) => [desc(meterCounts.date)],
        limit: 1,
      },
      yearlyMeterInstallations: {
        columns: {
          totalInstalled: true,
          registeredCount: true,
        },
        where: (yearlyMeterInstallations, { and, eq, lte }) =>
          and(
            eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
            lte(yearlyMeterInstallations.date, targetDate),
            eq(yearlyMeterInstallations.year, year),
          ),
        orderBy: (yearlyMeterInstallations, { desc }) => [
          desc(yearlyMeterInstallations.date),
        ],
        limit: 1,
      },
      monthlyMeterInstallations: {
        columns: {
          totalInstalled: true,
          registeredCount: true,
        },
        where: (monthlyMeterInstallations, { and, eq, lte }) =>
          and(
            eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
            lte(monthlyMeterInstallations.date, targetDate),
            eq(monthlyMeterInstallations.month, month),
            eq(monthlyMeterInstallations.year, year),
          ),
        orderBy: (monthlyMeterInstallations, { desc }) => [
          desc(monthlyMeterInstallations.date),
        ],
        limit: 1,
      },
    },
  });

  const transformedResult = result.map((substation) => ({
    id: substation.id,
    name: substation.name,
    registeredMeters: substation.meterCounts[0]?.registeredCount || 0,
    unregisteredMeters: substation.meterCounts[0]?.unregisteredCount || 0,
    yearlyMeterInstallations: substation.yearlyMeterInstallations[0] || {
      totalInstalled: 0,
      registeredCount: 0,
    },
    monthlyMeterInstallations: substation.monthlyMeterInstallations[0] || {
      totalInstalled: 0,
      registeredCount: 0,
    },
  }));

  return transformedResult;
}

interface SubstationMeterInstallationPeriodQuery {
  balanceGroup: BalanceGroup;
  periodStart: string;
  periodEnd: string;
}

export async function getLatestMeterInstallationsBySubstation({
  balanceGroup,
  periodStart,
  periodEnd,
}: SubstationMeterInstallationPeriodQuery) {
  if (new Date(periodStart) > new Date(periodEnd)) {
    throw new Error("periodStart must be before periodEnd");
  }

  const result = await db.query.transformerSubstations.findMany({
    columns: {
      id: true,
      name: true,
    },
    with: {
      monthlyMeterInstallations: {
        columns: {
          totalInstalled: true,
          registeredCount: true,
        },
        where: (monthlyMeterInstallations, { and, eq, gte, lte }) =>
          and(
            eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
            gte(monthlyMeterInstallations.date, periodStart),
            lte(monthlyMeterInstallations.date, periodEnd),
          ),
        orderBy: (monthlyMeterInstallations, { desc }) => [
          desc(monthlyMeterInstallations.date),
        ],
        limit: 1,
      },
    },
  });

  const transformedResult = result.map((substation) => ({
    id: substation.id,
    name: substation.name,
    installation: substation.monthlyMeterInstallations[0] || {
      totalInstalled: 0,
      registeredCount: 0,
    },
  }));

  return transformedResult;
}

type LatestMonthlyInstallationsBySubstationParams = Omit<
  SubstationMeterReportParams,
  "targetDate"
> & { cutoffDate: string };

interface MonthlyInstallations {
  id: number;
  name: string;
  installation: {
    totalInstalled: number;
    registeredCount: number;
  };
}

/**
 * Retrieves the latest monthly installation records for each substation up to a
 * specific cutoff date within a given month period
 *
 * Returns the most recent installation data for each substation that matches
 * the specified balance group, month, and year, with a date on or before the
 * cutoff date. If no installation records are found for a substation, returns
 * default values (0 for both counts).
 *
 * @example
 *   const installations = await getLatestMonthlyInstallationsBySubstation({
 *     balanceGroup: "Быт",
 *     cutoffDate: "2025-08-24",
 *     month: "08",
 *     year: 2025,
 *   });
 *   // Returns: [
 *   //   {
 *   //     id: 1,
 *   //     name: "ТП-1",
 *   //     installation: { totalInstalled: 10, registeredCount: 9 }
 *   //   },
 *   //   {
 *   //     id: 2,
 *   //     name: "ТП-2",
 *   //     installation: { totalInstalled: 15, registeredCount: 14 }
 *   //   }
 *   // ]
 *
 * @param params - Query parameters
 * @param params.balanceGroup - Balance group category to filter by (e.g.,
 *   "Быт", "ЮР Sims")
 * @param params.cutoffDate - Maximum date to include (YYYY-MM-DD format)
 * @param params.month - Target month in 01-12 format
 * @param params.year - Target year
 * @returns Array of substations with their latest installation summary.
 * @throws {Error} If month format is invalid (not in 01-12 format)
 * @throws {Error} If cutoffDate is before the start of the target month
 */
export async function getLatestMonthlyInstallationsBySubstation({
  balanceGroup,
  cutoffDate,
  month,
  year,
}: LatestMonthlyInstallationsBySubstationParams): Promise<
  MonthlyInstallations[]
> {
  if (!/^(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error("Month must be 01-12 format");
  }

  const monthStart = `${year}-${month}-01`;

  if (new Date(cutoffDate) < new Date(monthStart)) {
    throw new Error("cutoffDate cannot be before month start");
  }

  const result = await db.query.transformerSubstations.findMany({
    columns: {
      id: true,
      name: true,
    },
    with: {
      monthlyMeterInstallations: {
        columns: {
          totalInstalled: true,
          registeredCount: true,
        },
        where: (monthlyMeterInstallations, { and, eq, lte }) =>
          and(
            eq(monthlyMeterInstallations.balanceGroup, balanceGroup),
            lte(monthlyMeterInstallations.date, cutoffDate),
            eq(monthlyMeterInstallations.month, month),
            eq(monthlyMeterInstallations.year, year),
          ),
        orderBy: (monthlyMeterInstallations, { desc }) => [
          desc(monthlyMeterInstallations.date),
        ],
        limit: 1,
      },
    },
  });

  const transformedResult = result.map((substation) => ({
    id: substation.id,
    name: substation.name,
    installation: substation.monthlyMeterInstallations[0] || {
      totalInstalled: 0,
      registeredCount: 0,
    },
  }));

  return transformedResult;
}

interface SubstationMeterCount {
  id: number;
  name: string;
  registeredMeters: number;
  unregisteredMeters: number;
}

/**
 * Retrieves meter counts for all substations as of a specific date for a given
 * balance group
 *
 * This function queries all substations and returns their latest registered and
 * unregistered meter counts that are on or before the target date for the
 * specified balance group.
 *
 * @example
 *   const counts = await getSubstationMeterCountsAsOfDate(
 *     "Быт",
 *     "2025-08-24",
 *   );
 *   // Returns: [
 *   //   { id: 1, name: "ТП-1", registeredMeters: 15, unregisteredMeters: 1 },
 *   //   { id: 2, name: "ТП-2", registeredMeters: 20, unregisteredMeters: 5 },
 *   // ]
 *
 * @param balanceGroup - The balance group category to filter by
 * @param targetDate - The target date in YYYY-MM-DD format. Returns the latest
 *   records on or before this date.
 * @returns Array of substation meter counts with:
 *
 *   - `id`: Substation ID
 *   - `name`: Substation name
 *   - `registeredMeters`: Count of registered meters (0 if none found)
 *   - `unregisteredMeters`: Count of unregistered meters (0 if none found)
 */
export async function getSubstationMeterCountsAsOfDate(
  balanceGroup: BalanceGroup,
  targetDate: string,
): Promise<SubstationMeterCount[]> {
  const result = await db.query.transformerSubstations.findMany({
    columns: {
      id: true,
      name: true,
    },
    with: {
      meterCounts: {
        columns: {
          registeredCount: true,
          unregisteredCount: true,
        },
        where: (meterCounts, { eq, and, lte }) =>
          and(
            eq(meterCounts.balanceGroup, balanceGroup),
            lte(meterCounts.date, targetDate),
          ),
        orderBy: (meterCounts, { desc }) => [desc(meterCounts.date)],
        limit: 1,
      },
    },
  });

  const transformedResult = result.map((substation) => ({
    id: substation.id,
    name: substation.name,
    registeredMeters: substation.meterCounts[0]?.registeredCount || 0,
    unregisteredMeters: substation.meterCounts[0]?.unregisteredCount || 0,
  }));

  return transformedResult;
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

interface BatchedReportParams<Group extends BalanceGroup> {
  substationId: number;
  targetMonth: string;
  targetYear: number;
  balanceGroups: readonly Group[];
}

type BatchedReport<Groups extends BalanceGroup> = Record<Groups, MeterReport>;

/**
 * Retrieves batched meter reports for multiple balance groups
 *
 * @template Group - Specific balance group type
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Query parameters
 * @returns Report object keyed by balance groups
 */
export async function getBatchedSubstationMeterReports<
  Group extends BalanceGroup,
>(
  executor: Executor,
  {
    substationId,
    targetMonth,
    targetYear,
    balanceGroups,
  }: BatchedReportParams<Group>,
): Promise<BatchedReport<Group>> {
  const result = await executor.query.transformerSubstations.findFirst({
    columns: {},
    where: eq(transformerSubstations.id, substationId),
    with: {
      registeredMeters: {
        columns: { registeredMeterCount: true, balanceGroup: true },
        where: (registeredMeters, { inArray }) =>
          inArray(registeredMeters.balanceGroup, balanceGroups),
        orderBy: (registeredMeters, { desc }) => [desc(registeredMeters.date)],
      },
      unregisteredMeters: {
        columns: { unregisteredMeterCount: true, balanceGroup: true },
        where: (unregisteredMeters, { inArray }) =>
          inArray(unregisteredMeters.balanceGroup, balanceGroups),
        orderBy: (unregisteredMeters, { desc }) => [
          desc(unregisteredMeters.date),
        ],
      },
      yearlyMeterInstallations: {
        columns: {
          totalInstalled: true,
          registeredCount: true,
          balanceGroup: true,
        },
        where: (yearlyMeterInstallations, { and, eq, inArray }) =>
          and(
            inArray(yearlyMeterInstallations.balanceGroup, balanceGroups),
            eq(yearlyMeterInstallations.year, targetYear),
          ),
        orderBy: (yearlyMeterInstallations, { desc }) => [
          desc(yearlyMeterInstallations.date),
        ],
      },
      monthlyMeterInstallations: {
        columns: {
          totalInstalled: true,
          registeredCount: true,
          balanceGroup: true,
        },
        where: (monthlyMeterInstallations, { and, eq, inArray }) =>
          and(
            inArray(monthlyMeterInstallations.balanceGroup, balanceGroups),
            eq(monthlyMeterInstallations.month, targetMonth),
            eq(monthlyMeterInstallations.year, targetYear),
          ),
        orderBy: (monthlyMeterInstallations, { desc }) => [
          desc(monthlyMeterInstallations.date),
        ],
      },
    },
  });

  const report = {} as Record<Group, MeterReport>;

  for (const group of balanceGroups) {
    report[group] = {
      registeredMeters:
        result?.registeredMeters.find((r) => r.balanceGroup === group)
          ?.registeredMeterCount ?? 0,
      unregisteredMeters:
        result?.unregisteredMeters.find((u) => u.balanceGroup === group)
          ?.unregisteredMeterCount ?? 0,
      yearlyInstallation: result?.yearlyMeterInstallations.find(
        (y) => y.balanceGroup === group,
      ) ?? {
        totalInstalled: 0,
        registeredCount: 0,
      },
      monthlyInstallation: result?.monthlyMeterInstallations.find(
        (m) => m.balanceGroup === group,
      ) ?? {
        totalInstalled: 0,
        registeredCount: 0,
      },
    };
  }

  return report;
}

interface MeterCount {
  registeredCount: number;
  unregisteredCount: number;
}

interface MeterCountsForSubstation {
  privateMeters: MeterCount;
  legalSimsMeters: MeterCount;
  legalP2Meters: MeterCount;
  odpuSimsMeters: MeterCount;
  odpuP2Meters: MeterCount;
}

/**
 * Retrieves comprehensive meter counts for all balance groups in a substation
 * using different cutoff dates for each category.
 *
 * This function executes a single database query to fetch both registered and
 * unregistered meter counts for all balance groups, using appropriate cutoff
 * dates for each category.
 *
 * @example
 *   const counts = await getAllMeterCountsForSubstation({
 *     privateDate: "2025-08-24",
 *     legalDate: "2025-08-20",
 *     odpuDate: "2025-08-24",
 *     substationId: 42,
 *   });
 *
 * @param params - Query parameters
 * @param params.privateDate - Cutoff date for private meters (Быт)
 * @param params.legalDate - Cutoff date for legal meters (ЮР Sims, ЮР П2)
 * @param params.odpuDate - Cutoff date for ODPU meters (ОДПУ Sims, ОДПУ П2)
 * @param params.substationId - Substation ID
 * @returns Object containing meter counts for all balance groups
 */
export async function getAllMeterCountsForSubstation({
  privateDate,
  legalDate,
  odpuDate,
  substationId,
}: SubstationMeterDataParams): Promise<MeterCountsForSubstation> {
  const result = await db.query.transformerSubstations.findFirst({
    columns: {},
    where: eq(transformerSubstations.id, substationId),
    with: {
      meterCounts: {
        columns: {
          registeredCount: true,
          unregisteredCount: true,
          balanceGroup: true,
        },
        where: (meterCounts, { or, and, eq, lte }) =>
          or(
            and(
              eq(meterCounts.balanceGroup, "Быт"),
              lte(meterCounts.date, privateDate),
            ),
            and(
              eq(meterCounts.balanceGroup, "ЮР Sims"),
              lte(meterCounts.date, legalDate),
            ),
            and(
              eq(meterCounts.balanceGroup, "ЮР П2"),
              lte(meterCounts.date, legalDate),
            ),
            and(
              eq(meterCounts.balanceGroup, "ОДПУ Sims"),
              lte(meterCounts.date, odpuDate),
            ),
            and(
              eq(meterCounts.balanceGroup, "ОДПУ П2"),
              lte(meterCounts.date, odpuDate),
            ),
          ),
        orderBy: (meterCounts, { desc }) => [desc(meterCounts.date)],
      },
    },
  });

  // Helper function to extract the latest counts for a balance group
  const getLatestCount = (balanceGroup: BalanceGroup): MeterCount => {
    const records = result?.meterCounts?.filter(
      (m) => m.balanceGroup === balanceGroup,
    );

    if (!records || records.length === 0) {
      return {
        registeredCount: 0,
        unregisteredCount: 0,
      };
    }

    const record = records[0];

    return {
      registeredCount: record.registeredCount,
      unregisteredCount: record.unregisteredCount,
    };
  };

  return {
    privateMeters: {
      ...getLatestCount("Быт"),
    },
    legalSimsMeters: {
      ...getLatestCount("ЮР Sims"),
    },
    legalP2Meters: {
      ...getLatestCount("ЮР П2"),
    },
    odpuSimsMeters: {
      ...getLatestCount("ОДПУ Sims"),
    },
    odpuP2Meters: {
      ...getLatestCount("ОДПУ П2"),
    },
  };
}
