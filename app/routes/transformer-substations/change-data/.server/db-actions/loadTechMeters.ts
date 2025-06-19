import { getTechnicalMeterStatsForSubstation } from "~/.server/db-queries/technicalMeters";

export default async function loadTechMeters(id: number) {
  const techMeters = await getTechnicalMeterStatsForSubstation(id);
  return {
    quantity: techMeters?.quantity ?? 0,
    addedToSystem: techMeters?.underVoltage ?? 0,
  };
}
