import { db } from "../db";
import { TransformerSubstationTable } from "../schema";
import { eq } from 'drizzle-orm';

export const insertNewTS = async (
  name: string) => {
  const transSub = await db
    .insert(TransformerSubstationTable)
    .values({ name })
    .returning({
      id: TransformerSubstationTable.id,
      name: TransformerSubstationTable.name,
    });

  return transSub[0];
};

export const selectAllTransSubs = async (
) => {
    try {
      const transSubs = await db
        .select({
          id: TransformerSubstationTable.id,
          name: TransformerSubstationTable.name
        })
        .from(TransformerSubstationTable);

      return transSubs;
    } catch (error) {
      throw new Error('DB is not available', {
        cause: 'Cannot connect to db'
      });
    }
};

export const selectTransSub = async (
  id: string) => {
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
