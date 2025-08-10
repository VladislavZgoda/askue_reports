import {
  insertTechnicalMeters,
  updateTechnicalMetersForSubstation,
  getTechnicalMeterStatsForSubstation,
} from "~/.server/db-queries/technicalMeters";

import type { TechnicalFormData } from "../../validation/technical-form.schema";

type InputData = TechnicalFormData & { substationId: number };

export default async function changeTechMeters({
  quantity,
  underVoltage,
  substationId,
}: InputData) {
  const previousValues =
    await getTechnicalMeterStatsForSubstation(substationId);

  if (previousValues) {
    const isEqual =
      previousValues.quantity === quantity &&
      previousValues.underVoltage === underVoltage;

    if (!isEqual) {
      await updateTechnicalMetersForSubstation({
        quantity,
        underVoltage,
        substationId,
      });
    }
  } else {
    await insertTechnicalMeters({
      quantity,
      underVoltage,
      substationId,
    });
  }
}
