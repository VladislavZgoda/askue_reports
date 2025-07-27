import { db } from "../db";
import { transformerSubstations } from "../schema";
import { eq, ilike } from "drizzle-orm";
import composeSearchString from "~/utils/searchString";

export async function insertNewTS(name: string) {
  const transSub = await db
    .insert(transformerSubstations)
    .values({ name })
    .returning({
      id: transformerSubstations.id,
      name: transformerSubstations.name,
    });

  return transSub[0];
}

export async function selectTransSubs(searchParam: string | null) {
  try {
    const q = composeSearchString(searchParam);

    const transSubs = await db
      .select({
        id: transformerSubstations.id,
        name: transformerSubstations.name,
      })
      .from(transformerSubstations)
      .where(ilike(transformerSubstations.name, q));

    return transSubs;
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

export async function deleteTransSub(id: string) {
  await db
    .delete(transformerSubstations)
    .where(eq(transformerSubstations.id, Number(id)));
}

export async function updateTransSub(id: string, name: string) {
  const updatedAt = new Date();

  await db
    .update(transformerSubstations)
    .set({ name, updatedAt })
    .where(eq(transformerSubstations.id, Number(id)));
}

export async function selectAllSubstations() {
  const result = await db.query.transformerSubstations.findMany({
    columns: {
      id: true,
      name: true,
    },
  });

  return result;
}

interface SubstationMeterReportParams {
  balanceGroup: BalanceGroup;
  targetDate: string;
  month: string;
  year: number;
}

/**
 * Retrieves comprehensive meter reports for all substations as of a specific date
 *
 * Report includes for each substation:
 * - Current registered meter counts (latest before/on targetDate)
 * - Current unregistered meter counts (latest before/on targetDate)
 * - Yearly installation summary for specified year (latest before/on targetDate)
 * - Monthly installation summary for specified month/year (latest before/on targetDate)
 *
 * @param params Report parameters
 * @param params.balanceGroup Balance group to filter by
 * @param params.targetDate The "as-of" date for all reports (YYYY-MM-DD format)
 * @param params.month Target month for monthly installation data (MM format)
 * @param params.year Target year for yearly/monthly installation data
 *
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
      registeredMeters: {
        columns: {
          registeredMeterCount: true,
        },
        where: (registeredMeters, { eq, and, lte }) =>
          and(
            eq(registeredMeters.balanceGroup, balanceGroup),
            lte(registeredMeters.date, targetDate),
          ),
        orderBy: (registeredMeters, { desc }) => [desc(registeredMeters.date)],
        limit: 1,
      },
      unregisteredMeters: {
        columns: {
          unregisteredMeterCount: true,
        },
        where: (unregisteredMeters, { and, eq, lte }) =>
          and(
            eq(unregisteredMeters.balanceGroup, balanceGroup),
            lte(unregisteredMeters.date, targetDate),
          ),
        orderBy: (unregisteredMeters, { desc }) => [
          desc(unregisteredMeters.date),
        ],
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
    registeredMeters: substation.registeredMeters[0]?.registeredMeterCount || 0,
    unregisteredMeters:
      substation.unregisteredMeters[0]?.unregisteredMeterCount || 0,
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

/**
 * Retrieves the latest monthly installation records for each substation
 * up to a specific cutoff date within a given month/year period
 *
 * @param balanceGroup Balance group to filter by
 * @param cutoffDate Maximum date to include (YYYY-MM-DD format)
 * @param month Target month (01-12 format)
 * @param year Target year
 * @returns Array of substations with their latest installation summary
 */
export async function getLatestMonthlyInstallationsBySubstation({
  balanceGroup,
  cutoffDate,
  month,
  year,
}: LatestMonthlyInstallationsBySubstationParams) {
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

export async function getSubstationMeterCountsAsOfDate(
  balanceGroup: BalanceGroup,
  targetDate: string,
) {
  const result = await db.query.transformerSubstations.findMany({
    columns: {
      id: true,
      name: true,
    },
    with: {
      registeredMeters: {
        columns: {
          registeredMeterCount: true,
        },
        where: (registeredMeters, { eq, and, lte }) =>
          and(
            eq(registeredMeters.balanceGroup, balanceGroup),
            lte(registeredMeters.date, targetDate),
          ),
        orderBy: (registeredMeters, { desc }) => [desc(registeredMeters.date)],
        limit: 1,
      },
      unregisteredMeters: {
        columns: {
          unregisteredMeterCount: true,
        },
        where: (unregisteredMeters, { and, eq, lte }) =>
          and(
            eq(unregisteredMeters.balanceGroup, balanceGroup),
            lte(unregisteredMeters.date, targetDate),
          ),
        orderBy: (unregisteredMeters, { desc }) => [
          desc(unregisteredMeters.date),
        ],
        limit: 1,
      },
    },
  });

  const transformedResult = result.map((substation) => ({
    id: substation.id,
    name: substation.name,
    registeredMeters: substation.registeredMeters[0]?.registeredMeterCount || 0,
    unregisteredMeters:
      substation.unregisteredMeters[0]?.unregisteredMeterCount || 0,
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
 * @param params - Query parameters
 * @returns Report object keyed by balance groups
 */
export async function getBatchedSubstationMeterReports<
  Group extends BalanceGroup,
>({
  substationId,
  targetMonth,
  targetYear,
  balanceGroups,
}: BatchedReportParams<Group>): Promise<BatchedReport<Group>> {
  const result = await db.query.transformerSubstations.findFirst({
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
