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
