import { db } from "../db";
import { registeredMeters } from "../schema";
import { eq, and, desc, lte, lt } from "drizzle-orm";

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
export async function createRegisteredMeterRecord({
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
 * @throws Will throw if no record with the given ID exists
 *
 * @example
 * await updateRegisteredMeterRecordById({
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
  substationId,
}: MeterCountQueryParams) {
  const result = await db.query.registeredMeters.findFirst({
    columns: {
      registeredMeterCount: true,
    },
    where: and(
      eq(registeredMeters.balanceGroup, balanceGroup),
      eq(registeredMeters.transformerSubstationId, substationId),
      dateComparison === "before"
        ? lt(registeredMeters.date, targetDate)
        : lte(registeredMeters.date, targetDate),
    ),
    orderBy: [desc(registeredMeters.date)],
  });

  return result ? result.registeredMeterCount : 0;
}
