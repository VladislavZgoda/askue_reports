import createArchive from "../utils/create-archive";
import writeDbData from "./writeDbData";
import writeParsedData from "./writeParsedData";
import fsp from "fs/promises";
import fs from "fs";
import path from "path";
import type { FormData } from "../generate-reports";

export default async function composeReports(formData: FormData) {
  const partPath = "app/routes/generate-reports/.server/";

  if (!(await doesDirectoryExist(partPath)))
    await fsp.mkdir(partPath + "filled-reports/");

  await writeDbData(formData);

  if (formData.upload && formData.upload.size > 0)
    await writeParsedData(formData.upload);

  await createArchive();
  cleanUp(partPath);
}

async function doesDirectoryExist(partPath: string) {
  const path = partPath + "filled-reports/";

  try {
    return (await fsp.stat(path)).isDirectory();
  } catch (e) {
    console.log(e);
    return false;
  }
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
