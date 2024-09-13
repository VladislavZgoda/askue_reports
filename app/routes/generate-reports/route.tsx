import { useFetcher } from "@remix-run/react";
import DateInput from "~/components/DateInput";
import type { ActionFunctionArgs } from "@remix-run/node";
import { useEffect } from "react";
import {
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
  unstable_createFileUploadHandler as createFileUploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
} from "@remix-run/node";
import composeReports from "./.server/composeReports";
import DateInputWithoutDef from "./DateInputWithoutDef";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await parseMultipartFormData(
    request,
    composeUploadHandlers(
      createFileUploadHandler({
        filter({ contentType }) {
          return contentType.includes(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          );
        },
        directory: './app/routes/generate-reports/.server/uploaded-excel',
        avoidFileConflicts: false,
        file: () => 'supplement_nine.xlsx',
        maxPartSize: 10 * 1024 * 1024,
      }),
      createMemoryUploadHandler()
    )
  );

  const dates = Object.fromEntries(formData);
  delete dates.upload;

  await composeReports(dates);

  return Math.random() * 1000;
}

export default function GenerateReports() {
  const fetcher = useFetcher<typeof action>();
  const afterAction = fetcher.data;

  const download = () => {
    const link = document.createElement('a');
    link.href = '/download';

    link.setAttribute(
      'download',
      `Отчеты.zip`,
    );

    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  };

  useEffect(() => {
    if (afterAction) download();
  }, [afterAction]);

  return (
    <main className="mt-5 ml-10">
      <p className="mb-3 font-bold">Выберите даты для балансных групп</p>

      <fetcher.Form
        className="flex flex-col w-[30vw] gap-6"
        method="post"
        encType="multipart/form-data">

        <div className="flex flex-row gap-16 flex-auto">
          <div className="flex-auto">
            <DateInput labelText="Быт" inputName="privateDate" />
            <DateInput labelText="Юр" inputName="legalDate" />
            <DateInput labelText="ОДПУ" inputName="odpyDate" />
          </div>

          <div className="flex-auto">
            <DateInputWithoutDef labelText="Быт прошлый месяц" inputName="privateMonth" />
            <DateInputWithoutDef labelText="Юр прошлый месяц" inputName="legalMonth" />
            <DateInputWithoutDef labelText="ОДПУ прошлый месяц" inputName="odpyMonth" />
          </div>
        </div>

        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">
              Добавить данные из приложения №9
            </span>
          </div>
          <input
            aria-label="Добавить данные из приложения №9"
            type="file"
            name="upload"
            accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
        </label>

        <button className="btn btn-outline btn-primary mt-4" type="submit">
          Сформировать
        </button>
      </fetcher.Form>
    </main>
  );
}
