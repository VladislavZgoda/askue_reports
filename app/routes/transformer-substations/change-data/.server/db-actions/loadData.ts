import { getLatestSubstationMeterReport } from "~/.server/db-queries/transformerSubstations";

export default async function loadData(
  substationId: number,
  balanceGroup: BalanceGroup,
) {
  const targetYear = new Date().getFullYear();
  let targetMonth = String(new Date().getMonth() + 1);

  if (targetMonth.length === 1) {
    targetMonth = "0" + targetMonth;
  }

  const metersReport = getLatestSubstationMeterReport({
    balanceGroup,
    substationId,
    targetMonth,
    targetYear,
  });

  return metersReport;
}
