import { Form, useSubmit, useLoaderData } from "@remix-run/react";
import DateInput from "~/components/DateInput";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { isNotAuthenticated } from '~/.server/services/auth';
import todayDate from "~/helpers/getDate";
import { json } from '@remix-run/node';
import loadData from "./.server/loadData";

export async function loader({ request }: LoaderFunctionArgs) {
  await isNotAuthenticated(request);

  const url = new URL(request.url);
  const privateDate = url.searchParams.get('privateDate');
  const legalDate = url.searchParams.get('legalDate');
  const odpyDate = url.searchParams.get('odpyDate');

  const loadValues = {
    privateDate: privateDate ?? todayDate(),
    legalDate: legalDate ?? todayDate(),
    odpyDate: odpyDate ?? todayDate()
  };

  const data = await loadData(loadValues);

  return json({ loadValues, data });
}


export default function ViewData() {
  const submit = useSubmit();

  const { loadValues } = useLoaderData<typeof loader>();

  return (
    <main>
      <Form className="mt-5 flex justify-between w-[70%] mr-auto ml-auto"
        onChange={(e) => {
          submit(e.currentTarget);
        }}
      >
        <DateInput labelText="БЫТ" inputName="privateDate" defValue={loadValues.privateDate} />
        <DateInput labelText="ЮР" inputName="legalDate" defValue={loadValues.legalDate} />
        <DateInput labelText="ОДПУ" inputName="odpyDate" defValue={loadValues.odpyDate} />
      </Form>

      <div className="overflow-x-auto w-[70%] mr-auto ml-auto mt-5">
        <table className="table table-lg">
          <thead>
            <tr>
              <th></th>
              <th>ТП</th>
              <th>БЫТ</th>
              <th>ЮР</th>
              <th>ОДПУ</th>
              <th>Не в системе</th>
              <th>Всего</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>1</th>
              <td>ТП-1</td>
              <td>1</td>
              <td>2</td>
              <td>3</td>
              <td>4</td>
              <td>10</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

  );
}
