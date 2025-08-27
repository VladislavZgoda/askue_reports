import parseExcel from "./parse-excel";
import exceljs from "exceljs";

type ParseExcel = Awaited<ReturnType<typeof parseExcel>>;
type UploadedMetersReadings = Readonly<ParseExcel["uploadedMetersReadings"]>;
type TpMetersReadings = Readonly<ParseExcel["tpMetersReadings"]>;

export default async function writeParsedData(file: File) {
  const path = "app/routes/generate-reports/.server/filled-reports/";
  const { uploadedMetersReadings, tpMetersReadings } = await parseExcel(file);

  await handleReport(path, uploadedMetersReadings, tpMetersReadings);
  await handleSupplementThree(path, uploadedMetersReadings);
}

async function handleReport(
  path: string,
  uploadedMetersReadings: UploadedMetersReadings,
  tpMetersReadings: TpMetersReadings,
) {
  const filePath = path + "Отчет по дистанционным съемам.xlsx";

  const excel = new exceljs.Workbook();
  const wb = await excel.xlsx.readFile(filePath);
  const ws = wb.worksheets[0];

  // Первые 9 строк заняты и не изменяются, для динамического определения
  // строк после линий с ТП, их необходимо учесть в начальном отсчете.
  let rowCount = 9;

  ws.getColumn("B").eachCell((cell, rowNumber) => {
    const tp = cell.text.trim();

    if (!tp.startsWith("ТП")) return;

    rowCount += 1;

    const quantityReadings = tpMetersReadings[tp] ?? 0;

    ws.getCell("L" + rowNumber).value = quantityReadings;
    // Сбросить формулу, после обработки через exceljs, формулы не работают без этой процедуры.
    ws.getCell("M" + rowNumber).model.result = undefined;
  });

  ws.getCell(`L${rowCount + 1}`).value = uploadedMetersReadings.odpy.askue;
  ws.getCell(`M${rowCount + 1}`).model.result = undefined;

  ws.getCell(`L${rowCount + 2}`).value =
    uploadedMetersReadings.odpy.rider +
    uploadedMetersReadings.private.rider +
    uploadedMetersReadings.legal.rider;

  // Сбросить формулу, после обработки через exceljs, формулы не работают без этой процедуры.
  ws.getCell(`M${rowCount + 2}`).model.result = undefined;

  await excel.xlsx.writeFile(filePath);
}

async function handleSupplementThree(
  path: string,
  uploadedMetersReadings: UploadedMetersReadings,
) {
  const filePath = path + "Приложение №3.xlsx";

  const excel = new exceljs.Workbook();
  const wb = await excel.xlsx.readFile(filePath);
  const ws = wb.worksheets[2];

  ws.getCell("K29").value = uploadedMetersReadings.private.askue;
  ws.getCell("L29").value = uploadedMetersReadings.legal.askue;
  ws.getCell("M29").value = uploadedMetersReadings.odpy.askue;

  ws.getCell("N29").value = uploadedMetersReadings.private.rider;
  ws.getCell("O29").value = uploadedMetersReadings.legal.rider;
  ws.getCell("P29").value = uploadedMetersReadings.odpy.rider;

  await excel.xlsx.writeFile(filePath);
}
