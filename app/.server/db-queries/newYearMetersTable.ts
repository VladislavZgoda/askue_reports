import { db } from "../db";
import { NewYearMetersTable } from "../schema";
import type { YearMetersValues } from "~/types";

export const insertYearMeters = async ({
  quantity,
  added_to_system,
  type,
  date,
  transformerSubstationId,
  year
}: YearMetersValues) => {
  await db
  .insert(NewYearMetersTable)
  .values({
    quantity,
    added_to_system,
    type,
    date,
    transformerSubstationId,
    year
  });
};