import { selectTechnicalMeters } from "~/.server/db-queries/technicalMeters";

export default async function loadTechMeters(id: number) {
  const techMeters = await selectTechnicalMeters(id);
  return {
    quantity: techMeters[0]?.quantity ?? 0,
    addedToSystem: techMeters[0]?.underVoltage ?? 0,
  };
}
