import createArchive from "./createArchive";
import writeDbData from "./writeDbData";
import writeParsedData from "./writeParsedData";
import fsp from 'fs/promises';

type FormDates = {
  [k: string]: FormDataEntryValue;
};

export default async function composeReports(dates: FormDates) {
  await writeDbData(dates);

  if (await doesFileExist()) await writeParsedData();

  await createArchive();
}

async function doesFileExist() {
  const path = 'app/routes/generate-reports/.server/uploaded-excel/supplement_nine.xlsx';

  try {
    return (await fsp.stat(path)).isFile();
  } catch (e) {
    console.log(e);
    return false;
  }
}