import { db } from "../db";
import { registeredMeters } from "../schema";
import { eq, and, desc, lte, gt, lt } from "drizzle-orm";

type RegisteredMeters = typeof registeredMeters.$inferSelect;

interface RegisteredMeterInput {
  registeredMeterCount: RegisteredMeters["registeredMeterCount"];
  balanceGroup: RegisteredMeters["balanceGroup"];
  date: RegisteredMeters["date"];
  substationId: RegisteredMeters["transformerSubstationId"];
}

/**
 * Creates a new registered meter record
 *
 * @param registeredMeterCount Count of registered meters
 * @param balanceGroup Balance group category (e.g., "Быт", "ЮР Sims")
 * @param date Record date (YYYY-MM-DD format)
 * @param transformerSubstationId Transformer substation ID
 */
export async function insertRegisteredMeterRecord({
  registeredMeterCount,
  balanceGroup,
  date,
  substationId,
}: RegisteredMeterInput) {
  await db.insert(registeredMeters).values({
    registeredMeterCount,
    balanceGroup,
    date,
    transformerSubstationId: substationId,
  });
}

interface RegisteredMeterLookupParams {
  balanceGroup: RegisteredMeters["balanceGroup"];
  date: RegisteredMeters["date"];
  substationId: RegisteredMeters["transformerSubstationId"];
}

/**
 * Retrieves registered meter count for specific date, balance group and substation
 *
 * @param balanceGroup Balance group category (e.g., "Быт", "ЮР Sims")
 * @param date Record date (YYYY-MM-DD format)
 * @param substationId Transformer substation ID
 * @returns Number of registered meters, or undefined if no record exists
 */
export async function getRegisteredMeterCount({
  balanceGroup,
  date,
  substationId,
}: RegisteredMeterLookupParams): Promise<number | undefined> {
  const result = await db.query.registeredMeters.findFirst({
    columns: {
      registeredMeterCount: true,
    },
    where: and(
      eq(registeredMeters.balanceGroup, balanceGroup),
      eq(registeredMeters.date, date),
      eq(registeredMeters.transformerSubstationId, substationId),
    ),
  });

  return result?.registeredMeterCount;
}

interface RegisteredMeterCountUpdate {
  registeredMeterCount: RegisteredMeters["registeredMeterCount"];
  balanceGroup: RegisteredMeters["balanceGroup"];
  date: RegisteredMeters["date"];
  substationId: RegisteredMeters["transformerSubstationId"];
}

/**
 * Updates the registered meter count for a specific substation, date and balance group
 *
 * @param registeredMeterCount New count of registered meters
 * @param balanceGroup Balance group category
 * @param date Record date (YYYY-MM-DD format)
 * @param substationId Transformer substation ID
 *
 * @throws Will throw if no matching record exists
 */
export async function updateRegisteredMeterCount({
  registeredMeterCount,
  balanceGroup,
  date,
  substationId,
}: RegisteredMeterCountUpdate) {
  const updatedAt = new Date();

  const [updatedRecord] = await db
    .update(registeredMeters)
    .set({ registeredMeterCount, updatedAt })
    .where(
      and(
        eq(registeredMeters.transformerSubstationId, substationId),
        eq(registeredMeters.date, date),
        eq(registeredMeters.balanceGroup, balanceGroup),
      ),
    )
    .returning();

  if (!updatedRecord) {
    throw new Error("No matching registered meter record found to update");
  }
}

export async function selectLastQuantity({
  transformerSubstationId,
  balanceGroup,
}: LastQuantity): Promise<number | undefined> {
  const metersQuantity = await db
    .select({
      registeredMeterCount: registeredMeters.registeredMeterCount,
    })
    .from(registeredMeters)
    .where(
      and(
        eq(registeredMeters.transformerSubstationId, transformerSubstationId),
        eq(registeredMeters.balanceGroup, balanceGroup),
      ),
    )
    .orderBy(desc(registeredMeters.date))
    .limit(1);

  return metersQuantity[0]?.registeredMeterCount;
}

export async function getLastRecordId({
  transformerSubstationId,
  balanceGroup,
}: LastQuantity): Promise<number | undefined> {
  const recordId = await db
    .select({ id: registeredMeters.id })
    .from(registeredMeters)
    .where(
      and(
        eq(registeredMeters.transformerSubstationId, transformerSubstationId),
        eq(registeredMeters.balanceGroup, balanceGroup),
      ),
    )
    .orderBy(desc(registeredMeters.date))
    .limit(1);

  return recordId[0]?.id;
}

interface RegisteredMeterUpdateInput {
  id: number;
  registeredMeterCount: number;
}

/**
 * Updates a registered meter record by its ID
 *
 * @param id Record ID to update
 * @param registeredMeterCount New count of registered meters
 *
 * @returns The updated registered meter record
 * @throws Will throw if no record with the given ID exists
 *
 * @example
 * const updated = await updateRegisteredMeterRecordById({
 *   id: 123,
 *   registeredMeterCount: 85
 * });
 */
export async function updateRegisteredMeterRecordById({
  id,
  registeredMeterCount,
}: RegisteredMeterUpdateInput) {
  const updatedAt = new Date();

  const [updatedRecord] = await db
    .update(registeredMeters)
    .set({ registeredMeterCount, updatedAt })
    .where(eq(registeredMeters.id, id))
    .returning();

  if (!updatedRecord) {
    throw new Error(`Registered meter record with ID ${id} not found`);
  }
}

export async function getRegisteredMeterCountAtDate({
  balanceGroup,
  targetDate,
  dateComparison,
  transformerSubstationId,
}: MeterCountQueryParams) {
  const result = await db.query.registeredMeters.findFirst({
    columns: {
      registeredMeterCount: true,
    },
    where: and(
      eq(registeredMeters.balanceGroup, balanceGroup),
      eq(registeredMeters.transformerSubstationId, transformerSubstationId),
      dateComparison === "before"
        ? lt(registeredMeters.date, targetDate)
        : lte(registeredMeters.date, targetDate),
    ),
    orderBy: [desc(registeredMeters.date)],
  });

  return result ? result.registeredMeterCount : 0;
}

interface RegisteredMeterIdsQueryParams {
  balanceGroup: RegisteredMeters["balanceGroup"];
  startDate: RegisteredMeters["date"];
  substationId: RegisteredMeters["transformerSubstationId"];
}

/**
 * Retrieves IDs of registered meter records created after a specific date
 *
 * @param startDate Exclusive lower bound date (YYYY-MM-DD format).
 *                  Only records with date > startDate are returned.
 * @param balanceGroup Balance group category (e.g., "Быт", "ЮР Sims")
 * @param substationId Transformer substation identifier
 *
 * @returns Array of record IDs (numbers) for matching registered meter records.
 *          Returns empty array if no records found.
 *
 * @example
 * const ids = await getRegisteredMeterIdsAfterDate({
 *   startDate: '2023-01-01',
 *   balanceGroup: 'Быт',
 *   substationId: 42
 * });
 * // Returns: [101, 102, 103] (array of numbers)
 */
export async function getRegisteredMeterRecordIdsAfterDate({
  balanceGroup,
  startDate,
  substationId,
}: RegisteredMeterIdsQueryParams): Promise<number[]> {
  const result = await db
    .select({ id: registeredMeters.id })
    .from(registeredMeters)
    .where(
      and(
        gt(registeredMeters.date, startDate),
        eq(registeredMeters.balanceGroup, balanceGroup),
        eq(registeredMeters.transformerSubstationId, substationId),
      ),
    );

  const transformedResult = result.map((r) => r.id);

  return transformedResult;
}

/**
 * Retrieves the registered meter count value by its database record ID
 *
 * @param id Record ID of the registered meter entry
 * @returns Number of registered meters
 * @throws Will throw if no record with the given ID exists
 *
 * @example
 * const count = await getRegisteredMeterCountByRecordId(123);
 * // Returns: 85
 */
export async function getRegisteredMeterCountByRecordId(
  id: number,
): Promise<number> {
  const result = await db.query.registeredMeters.findFirst({
    columns: {
      registeredMeterCount: true,
    },
    where: eq(registeredMeters.id, id),
  });

  if (!result) {
    throw new Error(`Registered meter record with ID ${id} not found`);
  }

  return result.registeredMeterCount;
}
