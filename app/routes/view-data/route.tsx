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

  const { loadValues, data } = useLoaderData<typeof loader>();

  const transSubs = Object.keys(data).sort((a, b) =>
    a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: 'base'
    })
  );

  const tableRows = transSubs.map((transSub, index) => 
    <tr key={data[transSub].id} className="hover">
      <th>{index + 1}</th>
      <td>{transSub}</td>
      <td>{data[transSub].private}</td>
      <td>{data[transSub].legal}</td>
      <td>{data[transSub].odpy}</td>
      <td>{data[transSub].notInSystem}</td>
      <td>
        {data[transSub].private + data[transSub].legal 
        + data[transSub].odpy + data[transSub].notInSystem}
      </td>
    </tr>
  );

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

      <div className="overflow-x-auto w-[70%] max-h-[80vh] mr-auto ml-auto mt-5 mb-5">
        <table className="table table-lg">
          <thead className="sticky top-0 bg-base-200">
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
            {tableRows}
          </tbody>
        </table>
      </div>
    </main>
  );
}
