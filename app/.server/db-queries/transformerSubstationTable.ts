import { db } from "../db";
import { TransformerSubstationTable } from "../schema";
import { eq, ilike } from 'drizzle-orm';
import { searchString } from "../helpers/mutateString";

export const insertNewTS = async (
  name: string
) => {
  const transSub = await db
    .insert(TransformerSubstationTable)
    .values({ name })
    .returning({
      id: TransformerSubstationTable.id,
      name: TransformerSubstationTable.name,
    });

  return transSub[0];
};

export const selectTransSubs = async (
  searchParam: string | null
) => {
  try {
    const q = searchString(searchParam);

    const transSubs = await db
      .select({
        id: TransformerSubstationTable.id,
        name: TransformerSubstationTable.name
      })
      .from(TransformerSubstationTable)
      .where(ilike(TransformerSubstationTable.name, q));

    return transSubs;
  } catch (error) {
    throw new Error('DB is not available', {
      cause: 'Cannot connect to db'
    });
  }
};

export const selectTransSub = async (
  id: string
) => {
  const transSubs = await db
    .select({
      id: TransformerSubstationTable.id,
      name: TransformerSubstationTable.name
    })
    .from(TransformerSubstationTable)
    .where(eq(TransformerSubstationTable.id, Number(id)));

  return transSubs[0];
};

export const deleteTransSub = async (id: string) => {
  await db
    .delete(TransformerSubstationTable)
    .where(eq(TransformerSubstationTable.id, Number(id)));
};

export const updateTransSub = async (
  id: string,
  name: string
) => {
  const updated_at = new Date();

  await db
    .update(TransformerSubstationTable)
    .set({ name, updated_at })
    .where(eq(TransformerSubstationTable.id, Number(id)))
};
