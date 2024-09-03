import { useFetcher } from "@remix-run/react";
import DateInput from "~/components/DateInput";
import type { ActionFunctionArgs } from "@remix-run/node";
import fillExcel from "./.server/fillExcel";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const dates = Object.fromEntries(formData);

  await fillExcel(dates);
  
  return null;
}

export default function GenerateReports() {
  const fetcher = useFetcher();

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
