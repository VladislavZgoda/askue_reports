import { yearlyMeterInstallations } from "../schema";
import { eq, and, desc } from "drizzle-orm";

import { validateInstallationParams } from "~/utils/installation-params";

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
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Input data for the new record
 * @param params.totalInstalled - Total meters installed for the year
 * @param params.registeredCount - Meters registered in ASKUE system
 * @param params.balanceGroup - Balance group category
 * @param params.date - Date of the record
 * @param params.substationId - Transformer substation ID
 * @param params.year - Year of the installation record
 *
 * @throws Will throw if registeredCount more than totalInstalled
 * 
 * @example
 * await createYearlyMeterInstallation(tx, {
 *   totalInstalled: 6,
 *   registeredCount: 5,
 *   balanceGroup: "Быт",
 *   date: "2025-08-14",
 *   substationId: 15,
 *   year: 2025
 * })
 */
export async function createYearlyMeterInstallation(
  executor: Executor,
  params: YearlyMeterInstallationInput,
): Promise<void> {
  const {
    totalInstalled,
    registeredCount,
    balanceGroup,
    date,
    substationId,
    year,
  } = params;

  validateInstallationParams({
    totalInstalled,
    registeredCount,
  });

  await executor.insert(yearlyMeterInstallations).values({
    totalInstalled,
    registeredCount,
    balanceGroup,
    date,
    transformerSubstationId: substationId,
    year,
  });
}

interface YearlyInstallationIdParams {
  balanceGroup: YearlyMeterInstallations["balanceGroup"];
  substationId: YearlyMeterInstallations["transformerSubstationId"];
  year: YearlyMeterInstallations["year"];
}

/**
 * Retrieves the most recent yearly meter installation ID for a given combination of parameters
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Filter parameters
 * @param params.balanceGroup - Balance group category (e.g. "Быт")
 * @param params.substationId - Transformer substation ID (e.g. 777)
 * @param params.year - Year of the installation record (e.g. 2025)
 *
 * @returns The latest installation record ID, or 'undefined' if no match found
 *
 * @example
 * const id = await getLatestYearlyInstallationId(tx, {
 *   balanceGroup: "Быт",
 *   substationId: 15,
 *   year: 2025
 * })
 */
export async function getLatestYearlyInstallationId(
  executor: Executor,
  { balanceGroup, substationId, year }: YearlyInstallationIdParams,
): Promise<number | undefined> {
  const result = await executor.query.yearlyMeterInstallations.findFirst({
    columns: {
      id: true,
    },
    where: and(
      eq(yearlyMeterInstallations.balanceGroup, balanceGroup),
      eq(yearlyMeterInstallations.transformerSubstationId, substationId),
      eq(yearlyMeterInstallations.year, year),
    ),
    orderBy: [desc(yearlyMeterInstallations.date)],
  });

  return result?.id;
}

interface YearlyInstallationUpdateInput {
  id: YearlyMeterInstallations["id"];
  totalInstalled: YearlyMeterInstallations["totalInstalled"];
  registeredCount: YearlyMeterInstallations["registeredCount"];
}

/**
 * Updates a yearly installation record by its ID
 *
 * @param executor - Database client for query execution (supports transactions)
 * @param params - Update parameters
 * @param params.id - Record ID to update
 * @param params.totalInstalled - New total installed meters count
 * @param params.registeredCount - New registered meters count
 *
 * @throws Will throw if registeredCount more than totalInstalled
 * @throws Will throw if no record with the given ID exists
 *
 * @example
 * await updateYearlyInstallationRecordById(tx, {
 *   id: 12,
 *   totalInstalled: 5,
 *   registeredCount: 4
 * })
 */
export async function updateYearlyInstallationRecordById(
  executor: Executor,
  { id, totalInstalled, registeredCount }: YearlyInstallationUpdateInput,
): Promise<void> {
  validateInstallationParams({
    totalInstalled,
    registeredCount,
  });

  const updatedAt = new Date();

  const [updatedRecord] = await executor
    .update(yearlyMeterInstallations)
    .set({ totalInstalled, registeredCount, updatedAt })
    .where(eq(yearlyMeterInstallations.id, id))
    .returning();

  if (!updatedRecord) {
    throw new Error(`Yearly installation record with ID ${id} not found`);
  }
}
