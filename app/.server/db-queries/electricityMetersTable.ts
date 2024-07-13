import { db } from "../db";
import { ElectricityMetersTable } from "../schema";
import type { NewMetersValues } from "~/types";

export const insertNewMeters = async ({
  quantity,
  type,
  date,
  transformerSubstationId
 }: NewMetersValues) => {
  await db
    .insert(ElectricityMetersTable)
    .values({ quantity, type, date, transformerSubstationId })
 };
