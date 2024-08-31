import { selectAllTransSubs } from "~/.server/db-queries/transformerSubstationTable";

type LoadDates = {
  privateDate: string;
  legalDate: string;
  odpyDate: string;
};

export default async function loadData({
  privateDate, legalDate, odpyDate
}: LoadDates) {
  const transSubs = await selectAllTransSubs();
}
