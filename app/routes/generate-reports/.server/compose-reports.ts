import { mkdir } from "node:fs/promises";
import fs from "fs";
import path from "path";
import createArchive from "../utils/create-archive";
import writeDbData from "./write-db-data";
import writeParsedData from "./write-parsed-data";
import { isDirExists } from "../utils/fs-functions";
import type { FormData } from "../generate-reports";

export default async function composeReports(formData: FormData) {
  const partPath = "app/routes/generate-reports/.server/";

  if (!(await isDirExists(partPath + "filled-reports/")))
    await mkdir(partPath + "filled-reports/");

  await writeDbData(formData);

  if (formData.upload && formData.upload.size > 0)
    await writeParsedData(formData.upload);

  await createArchive();
  cleanUp(partPath);
}

function cleanUp(partPath: string) {
  const dirFilledReports = partPath + "filled-reports/";

  deleteFiles(dirFilledReports);
}

function deleteFiles(directory: string) {
  fs.readdir(directory, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(directory, file), (err) => {
        if (err) throw err;
      });
    }
  });
}
