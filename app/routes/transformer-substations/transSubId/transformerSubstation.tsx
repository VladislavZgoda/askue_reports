import { Form, useSubmit } from "react-router";
import { getTransformerSubstationById } from "~/.server/db-queries/transformerSubstations";
import StatTable from "./StatTable";
import Input from "~/components/Input";
import Fieldset from "~/components/Fieldset";
import getSubstationMeterSummary from "./.server/loadData";
import { todayDate } from "~/utils/dateFunctions";
import { isNotAuthenticated } from "~/.server/services/auth";
import type { Route } from "./+types/transformerSubstation";
import { createClientLoaderCache, CacheRoute } from "remix-client-cache";
import * as z from "zod/v4";

const dateSchema = z
  .string()
  .nullable()
  .transform((val) => (!val || val.length === 0 ? todayDate() : val));

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  if (!Number(params.id)) {
    throw new Error("Not Found");
  }

  await isNotAuthenticated(request);

  const substation = await getTransformerSubstationById(Number(params.id));

  if (!substation) {
    throw new Error("Not Found");
  }

  const url = new URL(request.url);
  const privateDate = dateSchema.parse(url.searchParams.get("privateDate"));
  const legalDate = dateSchema.parse(url.searchParams.get("legalDate"));
  const odpuDate = dateSchema.parse(url.searchParams.get("odpuDate"));

  const loadValues = {
    substationId: substation.id,
    privateDate,
    legalDate,
    odpuDate,
  };

  const meterSummary = await getSubstationMeterSummary(loadValues);

  return { substation, meterSummary, loadValues };
};

export const clientLoader = createClientLoaderCache<Route.ClientLoaderArgs>();

export default CacheRoute(function TransformerSubstation({
  loaderData,
}: Route.ComponentProps) {
  const { substation, meterSummary, loadValues } = loaderData;

  const submit = useSubmit();

  const onDelete = (e: React.FormEvent) => {
    const response = confirm("Подтвердите удаление.");
    if (!response) {
      e.preventDefault();
    }
  };

  return (
    <main className="m-2">
      <section className="flex justify-between w-[60%]">
        <ul className="menu bg-base-200 rounded-box w-96 menu-lg row-span-1 shadow-md">
          <li>
            <h2 className="menu-title">{substation.name}</h2>
            <ul>
              <li>
                <Form action="add-data" method="GET">
                  <button>Добавить данные</button>
                </Form>
              </li>
              <li>
                <Form action="change-data" method="GET">
                  <button>Изменить данные</button>
                </Form>
              </li>
              <li>
                <Form action="edit" method="GET">
                  <button>Переименовать ТП</button>
                </Form>
              </li>
              <li>
                <Form action="destroy" method="POST" onSubmit={onDelete}>
                  <button>Удалить ТП</button>
                </Form>
              </li>
            </ul>
          </li>
        </ul>

        <Form
          className="flex flex-col bg-base-200 px-10 py-5 rounded-md gap-2 shadow-md"
          onChange={(e) => {
            void submit(e.currentTarget);
          }}
        >
          <p>Выберете даты для данных</p>
          <Fieldset legend="БЫТ">
            <Input
              type="date"
              name="privateDate"
              defaultValue={loadValues.privateDate}
            />
          </Fieldset>

          <Fieldset legend="ЮР">
            <Input
              type="date"
              name="legalDate"
              defaultValue={loadValues.legalDate}
            />
          </Fieldset>

          <Fieldset legend="ОДПУ">
            <Input
              type="date"
              name="odpuDate"
              defaultValue={loadValues.odpuDate}
            />
          </Fieldset>
        </Form>
      </section>

      <section className="mt-2 w-[60%]">
        <StatTable summary={meterSummary} />
      </section>
    </main>
  );
});
