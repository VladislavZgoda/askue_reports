import { db } from "../db";
import { yearlyMeterInstallations } from "../schema";
import { eq, and, desc, gt, lt } from "drizzle-orm";

type YearlyMeterInstallations = typeof yearlyMeterInstallations.$inferSelect;

interface YearlyMeterInstallationInput {
  totalInstalled: YearlyMeterInstallations["totalInstalled"];
  registeredCount: YearlyMeterInstallations["registeredCount"];
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  date: YearlyMeterInstallations["date"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

/**
 * Creates a new yearly meter installation record
 *
 * @param totalInstalled Total meters installed for the year
 * @param registeredCount Meters registered in ASCAPC system
 * @param balanceGroup Balance group category
 * @param date Date of the record
 * @param substationId Transformer substation ID
 * @param year Year of the installation record
 */
export async function insertYearlyMeterInstallation({
  totalInstalled,
  registeredCount,
  balanceGroup,
  date,
  substationId,
  year,
}: YearlyMeterInstallationInput) {
  await db.insert(yearlyMeterInstallations).values({
    totalInstalled,
    registeredCount,
    balanceGroup,
    date,
    transformerSubstationId: substationId,
    year,
  });
}

interface YearlyMeterInstallationsStatsParams {
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  date: YearlyMeterInstallations["date"];
  year: YearlyMeterInstallations["year"];
  substationId: number;
}

export async function getYearlyMeterInstallationsStats({
  balanceGroup,
  date,
  substationId,
  year,
}: YearlyMeterInstallationsStatsParams) {
  const result = await db.query.yearlyMeterInstallations.findFirst({
    columns: {
      totalInstalled: true,
      registeredCount: true,
    },
    where: and(
      eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
      eq(yearlyMeterInstallations.date, date),
      eq(yearlyMeterInstallations.year, year),
      eq(yearlyMeterInstallations.transformerSubstationId, substationId),
    ),
  });

  return result;
}

export async function selectLastYearQuantity({
  balanceGroup,
  transformerSubstationId,
  year,
}: LastYearQuantity) {
  const yearQuantity = await db
    .select({
      totalInstalled: yearlyMeterInstallations.totalInstalled,
      registeredCount: yearlyMeterInstallations.registeredCount,
    })
    .from(yearlyMeterInstallations)
    .where(
      and(
        eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
        eq(
          yearlyMeterInstallations.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(yearlyMeterInstallations.year, year),
      ),
    )
    .orderBy(desc(yearlyMeterInstallations.date))
    .limit(1);

  return yearQuantity;
}

interface YearlyMeterInstallationUpdateParams {
  totalInstalled: YearlyMeterInstallations["totalInstalled"];
  registeredCount: YearlyMeterInstallations["registeredCount"];
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  date: YearlyMeterInstallations["date"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

/**
 * Updates an existing yearly meter installation record
 *
 * @param totalInstalled New total installed meters count
 * @param registeredCount New registered meters count
 * @param balanceGroup Balance group for the record
 * @param date Date of the installation record
 * @param substationId ID of the transformer substation
 * @param year Year of the installation record
 */
export async function updateYearlyMeterInstallation({
  totalInstalled,
  registeredCount,
  balanceGroup,
  date,
  substationId,
  year,
}: YearlyMeterInstallationUpdateParams) {
  const updatedAt = new Date();

  await db
    .update(yearlyMeterInstallations)
    .set({ totalInstalled, registeredCount, updatedAt })
    .where(
      and(
        eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
        eq(yearlyMeterInstallations.date, date),
        eq(yearlyMeterInstallations.transformerSubstationId, substationId),
        eq(yearlyMeterInstallations.year, year),
      ),
    );
}

export async function getLastYearId({
  balanceGroup,
  transformerSubstationId,
  year,
}: LastYearQuantity): Promise<number | undefined> {
  const recordId = await db
    .select({ id: yearlyMeterInstallations.id })
    .from(yearlyMeterInstallations)
    .where(
      and(
        eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
        eq(
          yearlyMeterInstallations.transformerSubstationId,
          transformerSubstationId,
        ),
        eq(yearlyMeterInstallations.year, year),
      ),
    )
    .orderBy(desc(yearlyMeterInstallations.date))
    .limit(1);

  return recordId[0]?.id;
}

interface UpdateYearlyMetersOnId {
  id: number;
  totalInstalled: number;
  registeredCount: number;
}

export async function updateYearOnId({
  id,
  totalInstalled,
  registeredCount,
}: UpdateYearlyMetersOnId) {
  const updatedAt = new Date();

  await db
    .update(yearlyMeterInstallations)
    .set({ totalInstalled, registeredCount, updatedAt })
    .where(eq(yearlyMeterInstallations.id, id));
}

interface YearlyInstallationRecordQuery {
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  startDate: YearlyMeterInstallations["date"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

/**
 * Retrieves yearly installation records after a specific date
 *
 * @param startDate Starting date (exclusive) for records (YYYY-MM-DD format)
 * @param balanceGroup Balance group filter
 * @param substationId Transformer substation ID
 * @param year Year filter
 * @returns Array of record objects containing IDs
 */
export async function getYearlyInstallationRecordsAfterDate({
  balanceGroup,
  startDate,
  substationId,
  year,
}: YearlyInstallationRecordQuery) {
  const result = await db.query.yearlyMeterInstallations.findMany({
    columns: {
      id: true,
    },
    where: and(
      eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
      gt(yearlyMeterInstallations.date, startDate),
      eq(yearlyMeterInstallations.transformerSubstationId, substationId),
      eq(yearlyMeterInstallations.year, year),
    ),
  });

  return result;
}

/**
 * Retrieves yearly installation summary by record ID
 *
 * @param id Record ID of the yearly installation summary
 * @returns Object with total installed and registered counts
 * @throws Will throw if record with given ID doesn't exist
 */
export async function getYearlyInstallationSummaryById(id: number) {
  const result = await db.query.yearlyMeterInstallations.findFirst({
    columns: {
      totalInstalled: true,
      registeredCount: true,
    },
    where: eq(yearlyMeterInstallations.id, id),
  });

  if (!result) {
    throw new Error(`Yearly installation summary with ID ${id} not found`);
  }

  return result;
}

interface YearlyInstallationSummaryQuery {
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  cutoffDate: YearlyMeterInstallations["date"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

/**
 * Retrieves the latest yearly installation summary before a cutoff date
 *
 * @param cutoffDate Exclusive upper bound date (YYYY-MM-DD format)
 * @param balanceGroup Balance group filter
 * @param substationId Transformer substation ID
 * @param year Year filter
 * @returns Summary object with total installed and registered counts,
 *          or default zero values if not found
 */
export async function getYearlyInstallationSummaryBeforeCutoff({
  balanceGroup,
  cutoffDate,
  substationId,
  year,
}: YearlyInstallationSummaryQuery) {
  const result = await db.query.yearlyMeterInstallations.findFirst({
    columns: {
      totalInstalled: true,
      registeredCount: true,
    },
    where: and(
      eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
      eq(yearlyMeterInstallations.year, year),
      eq(yearlyMeterInstallations.transformerSubstationId, substationId),
      lt(yearlyMeterInstallations.date, cutoffDate),
    ),
    orderBy: [desc(yearlyMeterInstallations.date)],
  });

  return result ?? { totalInstalled: 0, registeredCount: 0 };
}
