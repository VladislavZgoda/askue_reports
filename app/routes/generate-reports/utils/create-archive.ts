import { mkdir } from "fs/promises";
import { zip } from "zip-a-folder";
import { isDirExists } from "./fs-functions";

export default async function createArchive() {
  const folderPath = "app/routes/generate-reports/.server/filled-reports";
  const archivePath = "app/routes/generate-reports/.server/reports-archive";

  if (!(await isDirExists(archivePath))) await mkdir(archivePath);

  await zip(folderPath, `${archivePath}/reports.zip`);
}
