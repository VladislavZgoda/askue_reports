import { Form, useSubmit, useLoaderData } from "@remix-run/react";
import DateInput from "~/components/DateInput";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { isNotAuthenticated } from '~/.server/services/auth';
import todayDate from "~/helpers/getDate";
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

  return { loadValues, data };
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

  const privateTotal = transSubs.reduce((sum, transSub) =>
    sum + data[transSub].private , 0
  );

  const legalTotal = transSubs.reduce((sum, transSub) =>
    sum + data[transSub].legal , 0
  );

  const odpyTotal = transSubs.reduce((sum, transSub) =>
    sum + data[transSub].odpy , 0
  );

  const totalInSystem = privateTotal + legalTotal + odpyTotal;

  const totalCount = transSubs.reduce((sum, transSub) =>
    sum + data[transSub].notInSystem, 0
  ) + totalInSystem;

  return (
    <main className="w-[70%] mr-auto ml-auto">
      <Form className="mt-5 flex justify-between"
        onChange={(e) => {
          submit(e.currentTarget);
        }}
      >
        <DateInput labelText="БЫТ" inputName="privateDate" defValue={loadValues.privateDate} />
        <DateInput labelText="ЮР" inputName="legalDate" defValue={loadValues.legalDate} />
        <DateInput labelText="ОДПУ" inputName="odpyDate" defValue={loadValues.odpyDate} />
      </Form>

      <div className="overflow-x-auto max-h-[70vh] mt-5 mb-10">
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

      <div className="mb-5 flex flex-col items-end gap-1">
        <p>
          Всего БЫТ: <span className="font-bold">{privateTotal}</span>
        </p>
        <p>
          Всего ЮР: <span className="font-bold">{legalTotal}</span>
        </p>
        <p>
          Всего ОДПУ: <span className="font-bold">{odpyTotal}</span>
        </p>
        <p>
          Всего с возможностью опроса через ПО: <span className="font-bold">{totalInSystem}</span>
        </p>
        <p>
          Общее количество ТУ с возможностью опроса: <span className="font-bold">{totalCount}</span>
        </p>
      </div>
    </main>
  );
}
