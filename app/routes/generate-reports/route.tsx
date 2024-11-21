import { useFetcher } from "@remix-run/react";
import DateInput from "~/components/DateInput";
import type { ActionFunctionArgs } from "@remix-run/node";
import { useEffect, useRef } from "react";
import {
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
  unstable_createFileUploadHandler as createFileUploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
} from "@remix-run/node";
import composeReports from "./.server/composeReports";
import DateInputWithoutDef from "./DateInputWithoutDef";
import SelectMonth from "./SelectMonth";
import { todayDate, cutOutYear } from "~/utils/dateFunctions";

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
  console.log(dates);

  delete dates.upload;

  await composeReports(dates);

  return Math.random() * 1000;
}

export default function GenerateReports() {
  const fetcher = useFetcher<typeof action>();
  const afterAction = fetcher.data;
  const isSubmitting = fetcher.state === 'submitting';
  const formRef = useRef<HTMLFormElement>(null);

  const year = cutOutYear(todayDate());

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

  useEffect(() => {
    if (!isSubmitting) formRef.current?.reset();
  }, [isSubmitting]);

  return (
    <main className="mt-5 ml-10">
      <p className="mb-3 font-bold">Выберите даты для балансных групп</p>

      <fetcher.Form
        className="flex flex-col w-[30vw] gap-6"
        method="post"
        encType="multipart/form-data"
        ref={formRef}>

        <section className="flex flex-row gap-16 flex-auto">
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
        </section>

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

        <section className="flex gap-8">
          <SelectMonth />

          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">
                Выберете год для заголовков таблиц Excel
              </span>
            </div>
            <select
              className="select select-bordered"
              aria-label='Выберете балансовую принадлежность'
              defaultValue=""
              name='year'
              required
            >
              <option value="" disabled>Выбрать</option>
              <option>{year - 1}</option>
              <option>{year}</option>
            </select>
          </label>
        </section>

        <button className={`btn btn-outline btn-primary mt-4 ${isSubmitting && 'btn-active'}`}
          type={isSubmitting ? 'button' : 'submit'}>
          {isSubmitting && (<span className="loading loading-spinner"></span>)}
          {isSubmitting ? 'Создание...' : 'Сформировать'}
        </button>
      </fetcher.Form>
    </main>
  );
}
