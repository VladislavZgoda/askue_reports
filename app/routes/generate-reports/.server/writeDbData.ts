import exceljs from "exceljs";
import { selectAllSubstations } from "~/.server/db-queries/transformerSubstations";
import { getRegisteredMeterCountAtDate } from "~/.server/db-queries/registeredMeters";
import { getUnregisteredMeterCountAtDate } from "~/.server/db-queries/unregisteredMeters";
import { selectSumTechnicalMeters } from "~/.server/db-queries/technicalMeters";

import {
  getODPUMeterCount,
  getMeterCountAtDate,
  getLegalMeterCountAtDate,
  countUnregisteredMetersAtDate,
  accumulateMonthInstallationChanges,
  accumulatePeriodInstallationChanges,
} from "./db-actions/selectDbData";

import type { FormData } from "../generateReports";

export type Substations = Readonly<
  Awaited<ReturnType<typeof selectAllSubstations>>
>;

type ODPU = Readonly<Awaited<ReturnType<typeof getODPUMeterCount>>>;
type LegalMeters = Awaited<ReturnType<typeof getLegalMeterCountAtDate>>;
type PrivateMeters = Readonly<Awaited<ReturnType<typeof getMeterCountAtDate>>>;

export default async function writeDbData(formData: FormData) {
  const path = "app/routes/generate-reports/.server/";

  const substations: Substations = await selectAllSubstations();

  const [privateMeters, legalMeters, odpu] = await Promise.all([
    getMeterCountAtDate({
      substations,
      balanceGroup: "Быт",
      targetDate: formData.privateDate,
      func: getRegisteredMeterCountAtDate,
    }),
    getLegalMeterCountAtDate(substations, formData.legalDate),
    getODPUMeterCount(formData, substations),
  ]);

  await handlePrivateSector(path, privateMeters);

  await handleReport({
    path,
    privateMeters,
    legalMeters,
    substations,
    formData,
    odpu,
  });

  await handleSupplementThree({
    path,
    privateMeters,
    odpu,
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
  odpu: ODPU;
  substations: Substations;
  formData: FormData;
}

async function handleReport({
  path,
  privateMeters,
  legalMeters,
  substations,
  formData,
  odpu,
}: Report) {
  const templatePath = path + "workbooks/report.xlsx";
  const savePath = path + "filled-reports/Отчет по дистанционным съемам.xlsx";

  const excel = new exceljs.Workbook();
  const wb = await excel.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];

  const [unregisteredMeterCount, yearMeters, monthMeters] = await Promise.all([
    countUnregisteredMetersAtDate(substations, formData),
    accumulatePeriodInstallationChanges({
      substations,
      formData,
      period: "year",
    }),
    accumulateMonthInstallationChanges(substations, formData),
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
    const unregisteredMeters = unregisteredMeterCount[tp] ?? 0;

    const yearRegisteredMeters = yearMeters[tp]?.totalInstalled ?? 0;
    const yearUnregisteredMeters = yearMeters[tp]?.registeredCount ?? 0;

    const monthRegisteredMeters = monthMeters[tp]?.totalInstalled ?? 0;
    const monthUnregisteredMeters = monthMeters[tp]?.registeredCount ?? 0;

    ws.getCell("H" + rowNumber).value = privateM + legalM;
    ws.getCell("I" + rowNumber).value = privateM;
    ws.getCell("J" + rowNumber).value = legalM;
    ws.getCell("K" + rowNumber).value = p2;
    ws.getCell("P" + rowNumber).value = unregisteredMeters;
    ws.getCell("Q" + rowNumber).value = yearRegisteredMeters;
    ws.getCell("R" + rowNumber).value = yearUnregisteredMeters;
    ws.getCell("S" + rowNumber).value = monthRegisteredMeters;
    ws.getCell("T" + rowNumber).value = monthUnregisteredMeters;
    ws.getCell("O" + rowNumber).model.result = undefined;
  });

  const odpyRow = rowCount + 1;

  ws.getCell(`H${odpyRow}`).value = odpu.registeredMeterCount;
  ws.getCell(`P${odpyRow}`).value = odpu.unregisteredMeterCount;

  ws.getCell(`Q${odpyRow}`).value = odpu.year.totalInstalled;
  ws.getCell(`R${odpyRow}`).value = odpu.year.registeredCount;

  ws.getCell(`S${odpyRow}`).value = odpu.month.totalInstalled;
  ws.getCell(`T${odpyRow}`).value = odpu.month.registeredCount;

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
  odpu,
  formData,
  substations,
}: Report) {
  const templatePath = path + "workbooks/supplement_three.xlsx";
  const savePath = path + "filled-reports/Приложение №3.xlsx";

  const excel = new exceljs.Workbook();
  const wb = await excel.xlsx.readFile(templatePath);
  const ws = wb.worksheets[2];

  const unregisteredMetersPrivate = await getMeterCountAtDate({
    substations,
    balanceGroup: "Быт",
    targetDate: formData.privateDate,
    func: getUnregisteredMeterCountAtDate,
  });

  const privateRegisteredMeters = calculateSum(privateMeters);
  const privateUnregisteredMeters = calculateSum(unregisteredMetersPrivate);

  ws.getCell("D29").value = privateRegisteredMeters + privateUnregisteredMeters;
  ws.getCell("E29").value = privateRegisteredMeters;

  const [unregisteredMetersSims, unregisteredMetersP2] = await Promise.all([
    getMeterCountAtDate({
      substations,
      balanceGroup: "ЮР Sims",
      targetDate: formData.legalDate,
      func: getUnregisteredMeterCountAtDate,
    }),
    getMeterCountAtDate({
      substations,
      balanceGroup: "ЮР П2",
      targetDate: formData.legalDate,
      func: getUnregisteredMeterCountAtDate,
    }),
  ]);

  const legalRegisteredMeters =
    calculateSum(legalMeters.sims) + calculateSum(legalMeters.p2);
  const legalUnregisteredMeters =
    calculateSum(unregisteredMetersSims) + calculateSum(unregisteredMetersP2);

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

  ws.getCell("F29").value = legalRegisteredMeters + legalUnregisteredMeters;
  ws.getCell("G29").value = legalRegisteredMeters;

  ws.getCell("H29").value =
    odpu.registeredMeterCount + odpu.unregisteredMeterCount;

  ws.getCell("I29").value = odpu.registeredMeterCount;

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
