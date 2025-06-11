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

export async function selectTransSub(id: string) {
  const transSubs = await db
    .select({
      id: transformerSubstations.id,
      name: transformerSubstations.name,
    })
    .from(transformerSubstations)
    .where(eq(transformerSubstations.id, Number(id)));

  return transSubs[0];
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

export async function testGetWithMeters(
  balanceGroup: BalanceGroup,
  targetDate: string,
  month: string,
  year: number,
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
        where: (unregisteredMeters, { eq, and, lte }) =>
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
        where: (yearlyMeterInstallations, { eq, and, lte }) =>
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
        where: (monthlyMeterInstallations, { eq, and, lte }) =>
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

  return result;
}
