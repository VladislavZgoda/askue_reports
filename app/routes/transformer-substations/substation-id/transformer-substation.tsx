import * as z from "zod";
import { Form, useSubmit } from "react-router";
import { createClientLoaderCache, CacheRoute } from "remix-client-cache";

import { todayDate } from "~/utils/date-functions";
import { getTransformerSubstationById } from "~/.server/db-queries/transformer-substations";
import urlMiddleware from "~/.server/middleware/url";
import authMiddleware from "~/.server/middleware/auth";
import getSubstationMeterSummary from "./.server/load-data";

import SummaryTable from "./components/SummaryTable";
import Input from "~/components/Input";
import Fieldset from "~/components/Fieldset";

import type { Route } from "./+types/transformer-substation";

const dateSchema = z
  .string()
  .nullable()
  .transform((val) => (!val || val.length === 0 ? todayDate() : val));

export const middleware: Route.MiddlewareFunction[] = [
  authMiddleware,
  urlMiddleware,
];

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const substation = await getTransformerSubstationById(Number(params.id));

  if (!substation) {
    throw new Error("404 Not Found");
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
      <section className="flex w-[60%] justify-between">
        <ul className="menu bg-base-200 rounded-box menu-lg w-96 shadow-sm">
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
          className="card card-border bg-base-200 w-96 shadow-sm"
          onChange={(e) => {
            void submit(e.currentTarget);
          }}
        >
          <div className="card-body">
            <h2 className="card-title">Выберете даты для данных</h2>
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
          </div>
        </Form>
      </section>

      <section className="mt-2 w-[60%]">
        <SummaryTable summary={meterSummary} />
      </section>
    </main>
  );
});
