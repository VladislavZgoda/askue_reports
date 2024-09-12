import createArchive from "./createArchive";
import writeDbData from "./writeDbData";
import writeParsedData from "./writeParsedData";
import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import validateExcel from "./validateExcel";

type FormDates = {
  [k: string]: FormDataEntryValue;
};

export default async function composeReports(dates: FormDates) {
  const partPath = 'app/routes/generate-reports/.server/';

  if (! await doesDirectoryExist(partPath)) fsp.mkdir(partPath + 'filled-reports/');

  await writeDbData(dates);

  if (await doesFileExist(partPath)
    && await validateExcel()) await writeParsedData();

  await createArchive();

  await cleanUp(partPath);
}

async function doesFileExist(partPath: string) {
  const path = partPath + 'uploaded-excel/supplement_nine.xlsx';

  try {
    return (await fsp.stat(path)).isFile();
  } catch (e) {
    console.log(e);
    return false;
  }
}

async function doesDirectoryExist(partPath: string) {
  const path =  partPath + 'filled-reports/';

  try {
    return (await fsp.stat(path)).isDirectory();
  } catch (e) {
    console.log(e);
    return false;
  }
}

async function cleanUp(partPath: string) {
  const dirFilledReports = partPath + 'filled-reports/';
  const dirUploadedExcel = partPath + 'uploaded-excel/';

  deleteFiles(dirFilledReports);

  if (await doesFileExist(partPath)) deleteFiles(dirUploadedExcel);
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
