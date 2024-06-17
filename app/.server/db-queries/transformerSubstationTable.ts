import { db } from "../db";
import { TransformerSubstationTable } from "../schema";

interface TransformerSubstation {
  id: number;
  name: string;
}

export const insertNewTS = async (
  formData: FormData): Promise<TransformerSubstation> => {
  const name = String(formData.get('name'));
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
  ): Promise<TransformerSubstation[]> => {
    const transSubs = await db
      .select({
         id: TransformerSubstationTable.id,
         name: TransformerSubstationTable.name
      })
      .from(TransformerSubstationTable);
      return transSubs;
};
