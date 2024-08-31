import { selectDisabledLegalMeters } from "~/.server/db-queries/disabledLegalMetersTable";

export default async function loadDisabledLegalMeters(
  id: number
) {
  const disabledMeters = await selectDisabledLegalMeters(id) ?? 0;
  return disabledMeters;
}