import { db } from "../db";
import { TechnicalMeters } from "../schema";
import type { TechnicalMetersValues } from "~/types";

export const insertTechnicalMeters = async ({
  quantity,
  underVoltage,
  transformerSubstationId
}: TechnicalMetersValues) => {
  await db
    .insert(TechnicalMeters)
    .values({
      quantity,
      underVoltage,
      transformerSubstationId
    });
};
