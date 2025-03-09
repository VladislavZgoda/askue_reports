import { Form, useSubmit, data } from "react-router";
import DateInput from "~/components/DateInput";
import type { HeadersFunction } from "react-router";
import type { DbData } from "./view-data.types";
import createEtagHash from "~/utils/etagHash";
import { isNotAuthenticated } from "~/.server/services/auth";
import { todayDate } from "~/utils/dateFunctions";
import loadData from "./.server/loadData";
import cache from "~/utils/cache";
import type { Route } from "./+types/viewData";

export const headers: HeadersFunction = ({ loaderHeaders }) => loaderHeaders;

export async function loader({ request }: Route.LoaderArgs) {
  await isNotAuthenticated(request);

  const url = new URL(request.url);
  const privateDate = url.searchParams.get("privateDate") ?? todayDate();
  const legalDate = url.searchParams.get("legalDate") ?? todayDate();
  const odpyDate = url.searchParams.get("odpyDate") ?? todayDate();

  const cacheKey = `view-data${privateDate}${legalDate}${odpyDate}`;

  const loadValues = { privateDate, legalDate, odpyDate };

  if (cache.getKey(cacheKey) === undefined) {
    const transSubData = await loadData(loadValues);
    cache.setKey(cacheKey, { transSubData });
  }

  const { transSubData } = cache.getKey(cacheKey) as {
    transSubData: DbData;
  };

  const hash = createEtagHash({ loadValues, transSubData });
  const etag = request.headers.get("If-None-Match");

  if (etag === hash) {
    return new Response(undefined, { status: 304 }) as unknown as {
      loadValues: typeof loadValues;
      transSubData: typeof transSubData;
    };
  }

  return data(
    { loadValues, transSubData },
    {
      headers: {
        "Cache-Control": "no-cache",
        Etag: hash,
      },
    },
  );
}

export default function ViewData({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();

  const { loadValues, transSubData } = loaderData;

  const transSubs = Object.keys(transSubData).sort((a, b) =>
    a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

  const tableRows = transSubs.map((transSub, index) => (
    <tr key={transSubData[transSub].id} className="hover:bg-base-300">
      <th>{index + 1}</th>
      <td>{transSub}</td>
      <td>{transSubData[transSub].private}</td>
      <td>{transSubData[transSub].legal}</td>
      <td>{transSubData[transSub].odpy}</td>
      <td>{transSubData[transSub].notInSystem}</td>
      <td>
        {transSubData[transSub].private +
          transSubData[transSub].legal +
          transSubData[transSub].odpy +
          transSubData[transSub].notInSystem}
      </td>
    </tr>
  ));

  const privateTotal = transSubs.reduce(
    (sum, transSub) => sum + transSubData[transSub].private,
    0,
  );

  const legalTotal = transSubs.reduce(
    (sum, transSub) => sum + transSubData[transSub].legal,
    0,
  );

  const odpyTotal = transSubs.reduce(
    (sum, transSub) => sum + transSubData[transSub].odpy,
    0,
  );

  const totalInSystem = privateTotal + legalTotal + odpyTotal;

  const totalCount =
    transSubs.reduce(
      (sum, transSub) => sum + transSubData[transSub].notInSystem,
      0,
    ) + totalInSystem;

  return (
    <main className="w-[70%] mr-auto ml-auto">
      <Form
        className="mt-5 flex justify-between"
        onChange={(e) => {
          submit(e.currentTarget);
        }}
      >
        <DateInput
          labelText="БЫТ"
          inputName="privateDate"
          defValue={loadValues.privateDate}
        />
        <DateInput
          labelText="ЮР"
          inputName="legalDate"
          defValue={loadValues.legalDate}
        />
        <DateInput
          labelText="ОДПУ"
          inputName="odpyDate"
          defValue={loadValues.odpyDate}
        />
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
          <tbody>{tableRows}</tbody>
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
          Всего с возможностью опроса через ПО:{" "}
          <span className="font-bold">{totalInSystem}</span>
        </p>
        <p>
          Общее количество ТУ с возможностью опроса:{" "}
          <span className="font-bold">{totalCount}</span>
        </p>
      </div>
    </main>
  );
}
