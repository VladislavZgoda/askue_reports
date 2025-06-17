import { Form, useSubmit } from "react-router";
import Input from "~/components/Input";
import Fieldset from "~/components/Fieldset";
import { isNotAuthenticated } from "~/.server/services/auth";
import { todayDate } from "~/utils/dateFunctions";
import loadData from "./.server/loadData";
import type { Route } from "./+types/viewData";
import { createClientLoaderCache, CacheRoute } from "remix-client-cache";
import * as z from "zod/v4";

const dateSchema = z
  .string()
  .transform((val) => (val.length === 0 ? todayDate() : val));

export async function loader({ request }: Route.LoaderArgs) {
  await isNotAuthenticated(request);

  const url = new URL(request.url);

  const privateDate = dateSchema.parse(url.searchParams.get("privateDate"));
  const legalDate = dateSchema.parse(url.searchParams.get("legalDate"));
  const odpyDate = dateSchema.parse(url.searchParams.get("odpyDate"));

  const dates = { privateDate, legalDate, odpyDate };
  const transSubData = await loadData(dates);

  return { dates, transSubData };
}

export const clientLoader = createClientLoaderCache<Route.ClientLoaderArgs>();

export default CacheRoute(function ViewData({
  loaderData,
}: Route.ComponentProps) {
  const submit = useSubmit();

  const { dates, transSubData } = loaderData;

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
          void submit(e.currentTarget);
        }}
      >
        <div className="w-52 sm:w-56 md:w-64 lg:w-72">
          <Fieldset legend="БЫТ">
            <Input
              type="date"
              name="privateDate"
              defaultValue={dates.privateDate}
            />
          </Fieldset>
        </div>

        <div className="w-52 sm:w-56 md:w-64 lg:w-72">
          <Fieldset legend="ЮР">
            <Input
              type="date"
              name="legalDate"
              defaultValue={dates.legalDate}
            />
          </Fieldset>
        </div>

        <div className="w-52 sm:w-56 md:w-64 lg:w-72">
          <Fieldset legend="ОДПУ">
            <Input
              type="date"
              name="odpyDate"
              defaultValue={dates.odpyDate}
            />
          </Fieldset>
        </div>
      </Form>

      <div className="overflow-x-auto max-h-[70vh] mt-5 mb-10">
        <table className="table table-xs sm:table-sm md:table-md lg:table-lg">
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
});
