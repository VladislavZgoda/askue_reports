import { useFetcher } from "@remix-run/react";
import DateInput from "~/components/DateInput";
import type { ActionFunctionArgs } from "@remix-run/node";
import fillExcel from "./.server/fillExcel";
import createArchive from "./.server/createArchive";
import { useEffect } from "react";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const dates = Object.fromEntries(formData);

  await fillExcel(dates);
  await createArchive();
  
  return true;
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
      
      <fetcher.Form className="flex flex-col w-80 gap-2" method="post">
        <DateInput labelText="Быт" inputName="privateDate" />
        <DateInput labelText="Юр" inputName="legalDate" />
        <DateInput labelText="ОДПУ" inputName="odpyDate" />
        
        <button className="btn btn-outline btn-primary mt-4" type="submit">
          Сформировать
        </button>
      </fetcher.Form>
    </main>
  );
}
