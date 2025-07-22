import { Form, useSubmit } from "react-router";
import Input from "~/components/Input";
import Fieldset from "~/components/Fieldset";
import { isNotAuthenticated } from "~/.server/services/auth";
import { todayDate } from "~/utils/dateFunctions";
import getSubstationCategorySummary from "./.server/loadData";
import type { Route } from "./+types/viewData";
import { createClientLoaderCache, CacheRoute } from "remix-client-cache";
import * as z from "zod";

const dateSchema = z
  .string()
  .nullable()
  .transform((val) => (!val || val.length === 0 ? todayDate() : val));

export async function loader({ request }: Route.LoaderArgs) {
  await isNotAuthenticated(request);

  const url = new URL(request.url);

  const privateDate = dateSchema.parse(url.searchParams.get("privateDate"));
  const legalDate = dateSchema.parse(url.searchParams.get("legalDate"));
  const odpuDate = dateSchema.parse(url.searchParams.get("odpuDate"));

  const dates = { privateDate, legalDate, odpuDate };
  const substationSummaries = await getSubstationCategorySummary(dates);

  return { dates, substationSummaries };
}

export const clientLoader = createClientLoaderCache<Route.ClientLoaderArgs>();

export default CacheRoute(function ViewData({
  loaderData,
}: Route.ComponentProps) {
  const submit = useSubmit();

  const { dates, substationSummaries } = loaderData;

  const sortedSummaries = substationSummaries.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

  const tableRows = sortedSummaries.map((substation, i) => (
    <tr key={substation.id} className="hover:bg-base-300">
      <th>{i + 1}</th>
      <td>{substation.name}</td>
      <td className="text-center">{substation.private.registeredMeters}</td>
      <td className="text-center">{substation.private.unregisteredMeters}</td>
      <td className="text-center">{substation.legal.registeredMeters}</td>
      <td className="text-center">{substation.legal.unregisteredMeters}</td>
      <td className="text-center">{substation.odpu.registeredMeters}</td>
      <td className="text-center">{substation.odpu.unregisteredMeters}</td>
      <td className="text-center">
        {substation.private.unregisteredMeters +
          substation.legal.unregisteredMeters +
          substation.odpu.unregisteredMeters}
      </td>
      <td className="text-center">
        {substation.private.registeredMeters +
          substation.legal.registeredMeters +
          substation.odpu.registeredMeters}
      </td>
      <td className="text-center">
        {substation.private.unregisteredMeters +
          substation.legal.unregisteredMeters +
          substation.odpu.unregisteredMeters +
          substation.private.registeredMeters +
          substation.legal.registeredMeters +
          substation.odpu.registeredMeters}
      </td>
    </tr>
  ));

  const privateRegisteredTotal = substationSummaries.reduce(
    (sum, substation) => sum + substation.private.registeredMeters,
    0,
  );

  const privateUnregisteredTotal = substationSummaries.reduce(
    (sum, substation) => sum + substation.private.unregisteredMeters,
    0,
  );

  const legalRegisteredTotal = substationSummaries.reduce(
    (sum, substation) => sum + substation.legal.registeredMeters,
    0,
  );

  const legalUnregisteredTotal = substationSummaries.reduce(
    (sum, substation) => sum + substation.legal.unregisteredMeters,
    0,
  );

  const odpuRegisteredTotal = substationSummaries.reduce(
    (sum, substation) => sum + substation.odpu.registeredMeters,
    0,
  );

  const odpuUnregisteredTotal = substationSummaries.reduce(
    (sum, substation) => sum + substation.odpu.unregisteredMeters,
    0,
  );

  const registeredTotal =
    privateRegisteredTotal + legalRegisteredTotal + odpuRegisteredTotal;

  const unregisteredTotal =
    privateUnregisteredTotal + legalUnregisteredTotal + odpuUnregisteredTotal;

  const metersTotal = unregisteredTotal + registeredTotal;

  return (
    <main className="w-[90%] mr-auto ml-auto">
      <Form
        className="mt-5 flex justify-center gap-8"
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
            <Input type="date" name="odpuDate" defaultValue={dates.odpuDate} />
          </Fieldset>
        </div>
      </Form>

      <div className="overflow-x-auto max-h-[70vh] mt-5 mb-10">
        <table className="table table-xs sm:table-sm md:table-md lg:table-lg">
          <thead className="sticky top-0 bg-base-200">
            <tr>
              <th></th>
              <th>ТП</th>
              <th className="text-center">Быт</th>
              <th className="text-center">не в ПО</th>
              <th className="text-center">ЮР</th>
              <th className="text-center">не в ПО</th>
              <th className="text-center">ОДПУ</th>
              <th className="text-center">не в ПО</th>
              <th className="text-center">Всего не в ПО</th>
              <th className="text-center">Всего в ПО</th>
              <th className="text-center">Всего ТУ</th>
            </tr>
          </thead>
          <tbody>{tableRows}</tbody>
        </table>
      </div>

      <div className="mb-5 flex justify-end gap-8">
        <div className="flex flex-col gap-0.5">
          <p className="flex justify-between gap-2">
            Всего БЫТ в ПО:{" "}
            <span className="font-bold">{privateRegisteredTotal}</span>
          </p>
          <p className="flex justify-between gap-2">
            Всего БЫТ в не ПО:{" "}
            <span className="font-bold">{privateUnregisteredTotal}</span>
          </p>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="flex justify-between gap-2">
            Всего ЮР в ПО:{" "}
            <span className="font-bold">{legalRegisteredTotal}</span>
          </p>
          <p className="flex justify-between gap-2">
            Всего ЮР в не ПО:{" "}
            <span className="font-bold">{legalUnregisteredTotal}</span>
          </p>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="flex justify-between gap-2">
            Всего ОДПУ в ПО:{" "}
            <span className="font-bold">{odpuRegisteredTotal}</span>
          </p>
          <p className="flex justify-between gap-2">
            Всего ОДПУ в не ПО:{" "}
            <span className="font-bold">{odpuUnregisteredTotal}</span>
          </p>
        </div>
        <div className="flex flex-col justify-end gap-0.5">
          <p className="flex gap-2">
            Всего с возможностью опроса через ПО:{" "}
            <span className="font-bold">{registeredTotal}</span>
          </p>
          <p className="flex gap-2">
            Всего не зарегистрированных в ПО:{" "}
            <span className="font-bold">{unregisteredTotal}</span>
          </p>
          <p className="flex gap-2">
            Общее количество ТУ с возможностью опроса:{" "}
            <span className="font-bold">{metersTotal}</span>
          </p>
        </div>
      </div>
    </main>
  );
});
