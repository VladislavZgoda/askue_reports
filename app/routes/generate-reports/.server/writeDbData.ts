import exceljs from "exceljs";
import { selectAllTransSubs } from "~/.server/db-queries/transformerSubstationTable";
import { selectMetersOnDate } from "~/.server/db-queries/electricityMetersTable";
import { selectNotInSystemOnDate } from "~/.server/db-queries/notInSystemTable";
import {
  selectMeters,
  selectLegalMeters,
  calculateOdpy,
  selectPeriodMeters,
  selectNotInSystem,
  selectMonthMeters,
} from "./db-actions/selectDbData";
import type {
  Meters,
  Odpy,
  DifferentMeters,
  TransSubs,
} from "./db-actions/selectDbData";
import { selectSumTechnicalMeters } from "~/.server/db-queries/technicalMetersTable";

export type FormDates = {
  [k: string]: FormDataEntryValue;
};

export default async function writeDbData(dates: FormDates) {
  const excel = new exceljs.Workbook();
  const path = "app/routes/generate-reports/.server/";

  const transSubs = await selectAllTransSubs();

  const [privateMeters, legalMeters, odpy] = await Promise.all([
    selectMeters({
      transSubs,
      type: "Быт",
      date: dates.privateDate,
      func: selectMetersOnDate,
    }),
    selectLegalMeters(transSubs, dates.legalDate),
    calculateOdpy(dates, transSubs),
  ]);

  await handlePrivateSector(path, privateMeters, excel);

  await handleReport({
    path,
    privateMeters,
    legalMeters,
    transSubs,
    dates,
    odpy,
    excel,
  });

  await handleSupplementThree({
    path,
    privateMeters,
    odpy,
    excel,
    legalMeters,
    transSubs,
    dates,
  });
}

async function handlePrivateSector(
  path: string,
  privateMeters: Meters,
  excel: exceljs.Workbook,
) {
  const templatePath = path + "workbooks/private_sector.xlsx";
  const savePath = path + "filled-reports/Развитие ЧС.xlsx";

  const wb = await excel.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];

  // Первые две строки заняты и не изменяются, для динамического определения последней
  // строки с формулами, их необходимо учесть в начальном отсчете.
  let rowCount = 2;

  ws.getColumn("A").eachCell((cell, rowNumber) => {
    const transSub = String(cell.value).trim();

    if (!transSub.startsWith("ТП")) return;

    rowCount += 1;

    ws.getCell("B" + rowNumber).value = privateMeters[transSub] ?? 0;
    ws.getCell("G" + rowNumber).model.result = undefined;
    ws.getCell("H" + rowNumber).model.result = undefined;
  });

  resetResult(ws, rowCount + 1);

  // Без этой строки файл будет повреждён.
  ws.removeConditionalFormatting("");
  await excel.xlsx.writeFile(savePath);
}

type ReportType = {
  path: string;
  privateMeters: Meters;
  legalMeters: DifferentMeters;
  transSubs: TransSubs;
  dates: FormDates;
  odpy: Odpy;
  excel: exceljs.Workbook;
};

async function handleReport({
  path,
  privateMeters,
  legalMeters,
  transSubs,
  dates,
  odpy,
  excel,
}: ReportType) {
  const templatePath = path + "workbooks/report.xlsx";
  const savePath = path + "filled-reports/Отчет по дистанционным съемам.xlsx";

  const wb = await excel.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];

  const [notInSystem, yearMeters, monthMeters] = await Promise.all([
    selectNotInSystem(transSubs, dates),
    selectPeriodMeters({
      transSubs,
      dates,
    }),
    selectMonthMeters(transSubs, dates),
  ]);

  // Первые 9 строк заняты и не изменяются, для динамического определения
  // строк после линий с ТП, их необходимо учесть в начальном отсчете.
  let rowCount = 9;

  ws.getColumn("B").eachCell((cell, rowNumber) => {
    const transSub = String(cell.value).trim();

    if (!transSub.startsWith("ТП")) return;

    rowCount += 1;

    const privateM = privateMeters[transSub] ?? 0;

    const legalM =
      legalMeters["sims"][transSub] + legalMeters["p2"][transSub] || 0;

    const p2 = legalMeters["p2"][transSub] ?? 0;
    const notInSystemMeters = notInSystem[transSub] ?? 0;

    const yearQuantity = yearMeters[transSub]?.quantity ?? 0;
    const yearInSystem = yearMeters[transSub]?.added_to_system ?? 0;

    const monthQuantity = monthMeters[transSub]?.quantity ?? 0;
    const monthInSystem = monthMeters[transSub]?.added_to_system ?? 0;

    ws.getCell("H" + rowNumber).value = privateM + legalM;
    ws.getCell("I" + rowNumber).value = privateM;
    ws.getCell("J" + rowNumber).value = legalM;
    ws.getCell("K" + rowNumber).value = p2;
    ws.getCell("P" + rowNumber).value = notInSystemMeters;
    ws.getCell("Q" + rowNumber).value = yearQuantity;
    ws.getCell("R" + rowNumber).value = yearInSystem;
    ws.getCell("S" + rowNumber).value = monthQuantity;
    ws.getCell("T" + rowNumber).value = monthInSystem;
    ws.getCell("O" + rowNumber).model.result = undefined;
  });

  const odpyRow = rowCount + 1;

  ws.getCell(`H${odpyRow}`).value = odpy.quantity;
  ws.getCell(`P${odpyRow}`).value = odpy.notInSystem;
  ws.getCell(`Q${odpyRow}`).value = odpy.year.quantity;
  ws.getCell(`R${odpyRow}`).value = odpy.year.added_to_system;
  ws.getCell(`S${odpyRow}`).value = odpy.month.quantity;
  ws.getCell(`T${odpyRow}`).value = odpy.month.added_to_system;

  resetResult(ws, rowCount + 3);

  ws.getCell(`H${rowCount + 4}`).model.result = undefined;
  ws.getCell(`H${rowCount + 5}`).model.result = undefined;

  ws.getCell("A4").value =
    'Отчет филиала АО "Электросети Кубани" "Тимашевскэлектросеть" ' +
    `по работе систем  дистанционного съема показаний за ${dates.month} ${dates.year} года`;

  // Без этой строки файл будет повреждён, не объяснимо но факт.
  ws.removeConditionalFormatting("");
  await excel.xlsx.writeFile(savePath);
}

type SupplementThree = {
  path: string;
  privateMeters: Meters;
  legalMeters: DifferentMeters;
  odpy: Odpy;
  transSubs: TransSubs;
  dates: FormDates;
  excel: exceljs.Workbook;
};

async function handleSupplementThree({
  path,
  privateMeters,
  legalMeters,
  odpy,
  dates,
  transSubs,
  excel,
}: SupplementThree) {
  const templatePath = path + "workbooks/supplement_three.xlsx";
  const savePath = path + "filled-reports/Приложение №3.xlsx";

  const wb = await excel.xlsx.readFile(templatePath);
  const ws = wb.worksheets[2];

  const notInSystemPrivate = await selectMeters({
    transSubs,
    type: "Быт",
    date: dates.privateDate as string,
    func: selectNotInSystemOnDate,
  });

  const privateSum = calculateSum(privateMeters);
  const privateNotInSystemSum = calculateSum(notInSystemPrivate);

  ws.getCell("D29").value = privateSum + privateNotInSystemSum;
  ws.getCell("E29").value = privateSum;

  const [notInSystemSims, notInSystemP2] = await Promise.all([
    selectMeters({
      transSubs,
      type: "ЮР Sims",
      date: dates.legalDate as string,
      func: selectNotInSystemOnDate,
    }),
    selectMeters({
      transSubs,
      type: "ЮР П2",
      date: dates.legalDate as string,
      func: selectNotInSystemOnDate,
    }),
  ]);

  const legalSum =
    calculateSum(legalMeters.sims) + calculateSum(legalMeters.p2);
  const legalNotInSystemSum =
    calculateSum(notInSystemSims) + calculateSum(notInSystemP2);
  const technicalMeters = await selectSumTechnicalMeters();

  const technicalMetersQuantity = Number(technicalMeters[0].quantity ?? 0);
  const technicalMetersUnderVoltage = Number(
    technicalMeters[0].underVoltage ?? 0,
  );

  ws.getCell("Y29").value = technicalMetersQuantity;
  ws.getCell("Z29").value = technicalMetersUnderVoltage;

  const notUnderVoltage = technicalMetersQuantity - technicalMetersUnderVoltage;
  ws.getCell("AB29").value =
    `Технический учет - ${notUnderVoltage} шт. не под напряжением`;

  ws.getCell("F29").value = legalSum + legalNotInSystemSum;
  ws.getCell("G29").value = legalSum;

  ws.getCell("H29").value = odpy.quantity + odpy.notInSystem;
  ws.getCell("I29").value = odpy.quantity;

  resetResult(ws, 29);
  resetResult(ws, 33);

  ws.getCell("A2").value = `Отчетная форма за ${dates.month} ${dates.year}`;

  await excel.xlsx.writeFile(savePath);
}

// Сбросить результат формул, чтобы при открытие файла значение пересчиталось.
function resetResult(ws: exceljs.Worksheet, rowNumber: number) {
  ws.getRow(rowNumber).eachCell((cell) => (cell.model.result = undefined));
}

function calculateSum(meters: Meters) {
  let sum = 0;

  for (const key of Object.keys(meters)) {
    sum += meters[key];
  }

  return sum;
}
