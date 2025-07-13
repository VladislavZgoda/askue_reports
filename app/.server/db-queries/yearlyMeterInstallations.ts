import { db } from "../db";
import { yearlyMeterInstallations } from "../schema";
import { eq, and, desc } from "drizzle-orm";

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
 *
 * @throws Will throw if registeredCount more than totalInstalled
 */
export async function createYearlyMeterInstallation({
  totalInstalled,
  registeredCount,
  balanceGroup,
  date,
  substationId,
  year,
}: YearlyMeterInstallationInput) {
  if (registeredCount > totalInstalled) {
    throw new Error("Registered count cannot exceed total installed");
  }

  await db.insert(yearlyMeterInstallations).values({
    totalInstalled,
    registeredCount,
    balanceGroup,
    date,
    transformerSubstationId: substationId,
    year,
  });
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

interface YearlyInstallationUpdateInput {
  id: number;
  totalInstalled: number;
  registeredCount: number;
}

/**
 * Updates a yearly installation record by its ID
 *
 * @param id Record ID to update
 * @param totalInstalled New total installed meters count
 * @param registeredCount New registered meters count
 *
 * @throws Will throw if registeredCount more than totalInstalled
 * @throws Will throw if no record with the given ID exists
 */
export async function updateYearlyInstallationRecordById({
  id,
  totalInstalled,
  registeredCount,
}: YearlyInstallationUpdateInput) {
  if (registeredCount > totalInstalled) {
    throw new Error("Registered count cannot exceed total installed");
  }

  const updatedAt = new Date();

  const [updatedRecord] = await db
    .update(yearlyMeterInstallations)
    .set({ totalInstalled, registeredCount, updatedAt })
    .where(eq(yearlyMeterInstallations.id, id))
    .returning();

  if (!updatedRecord) {
    throw new Error(`Yearly installation record with ID ${id} not found`);
  }
}
