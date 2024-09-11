import { useFetcher } from "@remix-run/react";
import DateInput from "~/components/DateInput";
import type { ActionFunctionArgs } from "@remix-run/node";
import writeExcel from "./.server/writeExcel";
import createArchive from "./.server/createArchive";
import { useEffect } from "react";
import {
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
  unstable_createFileUploadHandler as createFileUploadHandler,
  unstable_composeUploadHandlers as composeUploadHandlers,
} from "@remix-run/node";

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
        directory: './app/routes/generate-reports/.server/upload-excel',
        avoidFileConflicts: false,
        file: () => 'supplement_nine.xlsx',
        maxPartSize: 10 * 1024 * 1024,
      }),
      createMemoryUploadHandler()
    )
  );
  
  const dates = Object.fromEntries(formData);
  delete dates.upload;
  
  await writeExcel(dates);
  await createArchive();
  
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
      <p className="mb-3 ml-6">Выберите даты для балансных групп</p>
      
      <fetcher.Form 
        className="flex flex-col w-80 gap-2" 
        method="post" 
        encType="multipart/form-data">

        <DateInput labelText="Быт" inputName="privateDate" />
        <DateInput labelText="Юр" inputName="legalDate" />
        <DateInput labelText="ОДПУ" inputName="odpyDate" />

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
