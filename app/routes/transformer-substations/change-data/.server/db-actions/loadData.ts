import { getLatestSubstationMeterReport } from "~/.server/db-queries/transformerSubstations";

export default async function loadData(
  substationId: number,
  balanceGroup: BalanceGroup,
) {
  const year = new Date().getFullYear();
  let month = String(new Date().getMonth() + 1);

  if (month.length === 1) {
    month = "0" + month;
  }

  const metersReport = getLatestSubstationMeterReport({
    balanceGroup,
    substationId,
    month,
    year,
  });

  return metersReport;
}
