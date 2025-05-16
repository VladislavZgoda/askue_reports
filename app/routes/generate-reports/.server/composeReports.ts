import createArchive from "./createArchive";
import writeDbData from "./writeDbData";
import writeParsedData from "./writeParsedData";
import fsp from "fs/promises";
import fs from "fs";
import path from "path";
import validateExcel from "./validateExcel";
import excelStorage from "~/routes/generate-reports/.server/fileStorage";
import type { FormData } from "../generateReports";

export default async function composeReports(formData: FormData) {
  const partPath = "app/routes/generate-reports/.server/";

  if (!(await doesDirectoryExist(partPath)))
    await fsp.mkdir(partPath + "filled-reports/");

  await writeDbData(formData);

  if (await validateExcel()) await writeParsedData();

  await createArchive();
  await cleanUp(partPath);
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

async function cleanUp(partPath: string) {
  const dirFilledReports = partPath + "filled-reports/";

  deleteFiles(dirFilledReports);

  if (await excelStorage.has("supplementNine"))
    await excelStorage.remove("supplementNine");
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
