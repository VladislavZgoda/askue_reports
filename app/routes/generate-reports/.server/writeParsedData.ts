import parseExcel from "./parseExcel";
import exceljs from "exceljs";

export default async function writeParsedData() {
  const path = "app/routes/generate-reports/.server/filled-reports/";
  const excel = new exceljs.Workbook();
  const data = await parseExcel();

  await handleReport(data, path, excel);
  await handleSupplementThree(data, path, excel);
}

type Data = {
  [k: string]: {
    [k: string]: number;
  };
};

async function handleReport(data: Data, path: string, excel: exceljs.Workbook) {
  const filePath = path + "Отчет по дистанционным съемам.xlsx";

  const wb = await excel.xlsx.readFile(filePath);
  const ws = wb.worksheets[0];

  ws.getColumn("B").eachCell((cell, rowNumber) => {
    const transSub = String(cell.value).trim();

    if (!transSub.startsWith("ТП")) return;

    const quantityPrivate = data.private[transSub] ?? 0;
    const quantityLegal = data.legal[transSub] ?? 0;
    const total = quantityPrivate + quantityLegal;

    ws.getCell("L" + rowNumber).value = total;
    ws.getCell("M" + rowNumber).model.result = undefined;
  });

  ws.getCell("L265").value = data.odpy.total;
  ws.getCell("M265").model.result = undefined;

  ws.getCell("L266").value =
    data.odpy.rider + data.private.rider + data.legal.rider;
  ws.getCell("M266").model.result = undefined;

  await excel.xlsx.writeFile(filePath);
}

async function handleSupplementThree(
  data: Data,
  path: string,
  excel: exceljs.Workbook,
) {
  const filePath = path + "Приложение №3.xlsx";

  const wb = await excel.xlsx.readFile(filePath);
  const ws = wb.worksheets[2];

  ws.getCell("K29").value = data.private.total;
  ws.getCell("L29").value = data.legal.total;
  ws.getCell("M29").value = data.odpy.total;

  ws.getCell("N29").value = data.private.rider;
  ws.getCell("O29").value = data.legal.rider;
  ws.getCell("P29").value = data.odpy.rider;

  await excel.xlsx.writeFile(filePath);
}
