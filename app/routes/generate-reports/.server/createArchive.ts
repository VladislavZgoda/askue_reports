import { zip } from "zip-a-folder";
import fs from "fs";

export default async function createArchive() {
  const folderPath = "app/routes/generate-reports/.server/filled-reports";
  const archivePath = "app/routes/generate-reports/.server/reports-archive";

  if (!fs.existsSync(archivePath)) fs.mkdirSync(archivePath);

  await zip(folderPath, `${archivePath}/reports.zip`);
}
