import type { HeadersFunction } from "react-router";
import { Form, useSubmit, data } from "react-router";
import { selectTransSub } from "~/.server/db-queries/transformerSubstationTable";
import invariant from "tiny-invariant";
import StatTable from "./StatTable";
import NavigateForm from "./NavigateForm";
import DateInput from "~/components/DateInput";
import loadData from "./.server/loadData";
import { todayDate } from "~/utils/dateFunctions";
import { isNotAuthenticated } from "~/.server/services/auth";
import createEtagHash from "~/utils/etagHash";
import cache from "~/utils/cache";
import type { Route } from "./+types/transformerSubstation";

export const headers: HeadersFunction = ({ loaderHeaders }) => loaderHeaders;

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  invariant(params.id, "Expected params.id");

  if (!Number(params.id)) {
    throw new Response("Not Found", { status: 404 });
  }

  await isNotAuthenticated(request);

  const transSub = await selectTransSub(params.id);

  if (!transSub) {
    throw new Response("Not Found", { status: 404 });
  }

  const url = new URL(request.url);
  const privateDate = url.searchParams.get("privateDate") ?? todayDate();
  const legalDate = url.searchParams.get("legalDate") ?? todayDate();
  const odpyDate = url.searchParams.get("odpyDate") ?? todayDate();

  const cacheKey = `transformer-substations${transSub.id}${privateDate}${legalDate}${odpyDate}`;

  const loadValues = {
    id: transSub.id,
    privateDate,
    legalDate,
    odpyDate,
  };

  if (cache.getKey(cacheKey) === undefined) {
    const transSubData = await loadData(loadValues);
    cache.setKey(cacheKey, { transSubData });
  }

  const { transSubData } = cache.getKey(cacheKey) as {
    transSubData: {
      privateMeters: DbData;
      legalSims: DbData;
      legalP2: DbData;
      odpySims: DbData;
      odpyP2: DbData;
      techMeters: {
        quantity: number;
        underVoltage: number;
      };
    };
  };

  const hash = createEtagHash({ transSub, transSubData, loadValues });

  const etag = request.headers.get("If-None-Match");

  if (etag === hash) {
    return new Response(undefined, { status: 304 }) as unknown as {
      loadValues: typeof loadValues;
      transSub: typeof transSub;
      transSubData: typeof transSubData;
    };
  }

  return data(
    { transSub, transSubData, loadValues },
    {
      headers: {
        "Cache-Control": "no-cache",
        Etag: hash,
      },
    },
  );
};

export default function TransformerSubstation({
  loaderData,
}: Route.ComponentProps) {
  const { transSub, transSubData, loadValues } = loaderData;

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
            <h2 className="menu-title">{transSub.name}</h2>
            <ul>
              <li>
                <NavigateForm
                  actionName="add-data"
                  btnText="Добавить данные"
                  onDelete={undefined}
                  methodType="GET"
                />
              </li>
              <li>
                <NavigateForm
                  actionName="change-data"
                  btnText="Изменить данные"
                  onDelete={undefined}
                  methodType="GET"
                />
              </li>
              <li>
                <NavigateForm
                  actionName="edit"
                  btnText="Переименовать ТП"
                  onDelete={undefined}
                  methodType="GET"
                />
              </li>
              <li>
                <NavigateForm
                  actionName="destroy"
                  btnText="Удалить ТП"
                  onDelete={onDelete}
                  methodType="POST"
                />
              </li>
            </ul>
          </li>
        </ul>

        <Form
          className="flex flex-col bg-base-200 px-10 py-5 rounded-md gap-2 shadow-md"
          onChange={(e) => {
            submit(e.currentTarget);
          }}
        >
          <p>Выберете даты для данных</p>
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
      </section>

      <section className="mt-2 w-[60%]">
        <StatTable data={transSubData} />
      </section>
    </main>
  );
}
