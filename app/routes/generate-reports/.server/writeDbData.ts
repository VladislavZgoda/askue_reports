import exceljs from "exceljs";
import { selectAllSubstations } from "~/.server/db-queries/transformerSubstations";
import { getRegisteredMeterCountAtDate } from "~/.server/db-queries/registeredMeters";
import { getUnregisteredMeterCountAtDate } from "~/.server/db-queries/unregisteredMeters";
import { selectSumTechnicalMeters } from "~/.server/db-queries/technicalMeters";

import {
  selectMeters,
  selectLegalMeters,
  selectPeriodMeters,
  selectNotInSystem,
  selectMonthMeters,
  getODPUMeterCount,
} from "./db-actions/selectDbData";

import type { FormData } from "../generateReports";

export type Substations = Readonly<
  Awaited<ReturnType<typeof selectAllSubstations>>
>;

type Odpy = Readonly<Awaited<ReturnType<typeof getODPUMeterCount>>>;
type LegalMeters = Awaited<ReturnType<typeof selectLegalMeters>>;
type PrivateMeters = Readonly<Awaited<ReturnType<typeof selectMeters>>>;

export default async function writeDbData(formData: FormData) {
  const path = "app/routes/generate-reports/.server/";

  const substations: Substations = await selectAllSubstations();

  const [privateMeters, legalMeters, odpy] = await Promise.all([
    selectMeters({
      substations,
      balanceGroup: "Быт",
      targetDate: formData.privateDate,
      func: getRegisteredMeterCountAtDate,
    }),
    selectLegalMeters(substations, formData.legalDate),
    getODPUMeterCount(formData, substations),
  ]);

  await handlePrivateSector(path, privateMeters);

  await handleReport({
    path,
    privateMeters,
    legalMeters,
    substations,
    formData,
    odpy,
  });

  await handleSupplementThree({
    path,
    privateMeters,
    odpy,
    legalMeters,
    substations,
    formData,
  });
}

async function handlePrivateSector(path: string, privateMeters: PrivateMeters) {
  const templatePath = path + "workbooks/private_sector.xlsx";
  const savePath = path + "filled-reports/Развитие ЧС.xlsx";

  const excel = new exceljs.Workbook();
  const wb = await excel.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];

  // Первые две строки заняты и не изменяются, для динамического определения последней
  // строки с формулами, их необходимо учесть в начальном отсчете.
  let rowCount = 2;

  ws.getColumn("A").eachCell((cell, rowNumber) => {
    const tp = cell.text.trim();

    if (!tp.startsWith("ТП")) return;

    rowCount += 1;

    ws.getCell("B" + rowNumber).value = privateMeters[tp] ?? 0;
    ws.getCell("G" + rowNumber).model.result = undefined;
    ws.getCell("H" + rowNumber).model.result = undefined;
  });

  resetResult(ws, rowCount + 1);

  // Без этой строки файл будет повреждён.
  ws.removeConditionalFormatting("");
  await excel.xlsx.writeFile(savePath);
}

interface Report {
  path: string;
  privateMeters: PrivateMeters;
  legalMeters: LegalMeters;
  odpy: Odpy;
  substations: Substations;
  formData: FormData;
}

async function handleReport({
  path,
  privateMeters,
  legalMeters,
  substations,
  formData,
  odpy,
}: Report) {
  const templatePath = path + "workbooks/report.xlsx";
  const savePath = path + "filled-reports/Отчет по дистанционным съемам.xlsx";

  const excel = new exceljs.Workbook();
  const wb = await excel.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];

  const [notInSystem, yearMeters, monthMeters] = await Promise.all([
    selectNotInSystem(substations, formData),
    selectPeriodMeters({
      substations,
      formData,
      period: "year",
    }),
    selectMonthMeters(substations, formData),
  ]);

  // Первые 9 строк заняты и не изменяются, для динамического определения
  // строк после линий с ТП, их необходимо учесть в начальном отсчете.
  let rowCount = 9;

  ws.getColumn("B").eachCell((cell, rowNumber) => {
    const tp = cell.text.trim();

    if (!tp.startsWith("ТП")) return;

    rowCount += 1;

    const privateM = privateMeters[tp] ?? 0;
    const legalM = legalMeters.sims[tp] + legalMeters.p2[tp] || 0;

    const p2 = legalMeters.p2[tp] ?? 0;
    const notInSystemMeters = notInSystem[tp] ?? 0;

    const yearQuantity = yearMeters[tp]?.totalInstalled ?? 0;
    const yearInSystem = yearMeters[tp]?.registeredCount ?? 0;

    const monthQuantity = monthMeters[tp]?.totalInstalled ?? 0;
    const monthInSystem = monthMeters[tp]?.registeredCount ?? 0;

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

  ws.getCell(`H${odpyRow}`).value = odpy.registeredMeterCount;
  ws.getCell(`P${odpyRow}`).value = odpy.unregisteredMeterCount;

  ws.getCell(`Q${odpyRow}`).value = odpy.year.totalInstalled;
  ws.getCell(`R${odpyRow}`).value = odpy.year.registeredCount;

  ws.getCell(`S${odpyRow}`).value = odpy.month.totalInstalled;
  ws.getCell(`T${odpyRow}`).value = odpy.month.registeredCount;

  resetResult(ws, rowCount + 3);

  ws.getCell(`H${rowCount + 4}`).model.result = undefined;
  ws.getCell(`H${rowCount + 5}`).model.result = undefined;

  ws.getCell("A4").value =
    'Отчет филиала АО "Электросети Кубани" "Тимашевскэлектросеть" ' +
    `по работе систем  дистанционного съема показаний за ${formData.month} ${formData.year} года`;

  // Без этой строки файл будет повреждён, не объяснимо но факт.
  ws.removeConditionalFormatting("");
  await excel.xlsx.writeFile(savePath);
}

async function handleSupplementThree({
  path,
  privateMeters,
  legalMeters,
  odpy,
  formData,
  substations,
}: Report) {
  const templatePath = path + "workbooks/supplement_three.xlsx";
  const savePath = path + "filled-reports/Приложение №3.xlsx";

  const excel = new exceljs.Workbook();
  const wb = await excel.xlsx.readFile(templatePath);
  const ws = wb.worksheets[2];

  const notInSystemPrivate = await selectMeters({
    substations,
    balanceGroup: "Быт",
    targetDate: formData.privateDate,
    func: getUnregisteredMeterCountAtDate,
  });

  const privateSum = calculateSum(privateMeters);
  const privateNotInSystemSum = calculateSum(notInSystemPrivate);

  ws.getCell("D29").value = privateSum + privateNotInSystemSum;
  ws.getCell("E29").value = privateSum;

  const [notInSystemSims, notInSystemP2] = await Promise.all([
    selectMeters({
      substations,
      balanceGroup: "ЮР Sims",
      targetDate: formData.legalDate,
      func: getUnregisteredMeterCountAtDate,
    }),
    selectMeters({
      substations,
      balanceGroup: "ЮР П2",
      targetDate: formData.legalDate,
      func: getUnregisteredMeterCountAtDate,
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

  ws.getCell("H29").value =
    odpy.registeredMeterCount + odpy.unregisteredMeterCount;

  ws.getCell("I29").value = odpy.registeredMeterCount;

  resetResult(ws, 29);
  resetResult(ws, 33);

  ws.getCell("A2").value =
    `Отчетная форма за ${formData.month} ${formData.year}`;

  await excel.xlsx.writeFile(savePath);
}

// Сбросить результат формул, чтобы при открытие файла значение пересчиталось.
function resetResult(ws: exceljs.Worksheet, rowNumber: number) {
  ws.getRow(rowNumber).eachCell((cell) => (cell.model.result = undefined));
}

function calculateSum(meters: PrivateMeters) {
  let sum = 0;

  for (const key of Object.keys(meters)) {
    sum += meters[key];
  }

  return sum;
}
