import type {
  LoaderFunctionArgs,
  ActionFunctionArgs
} from "@remix-run/node";
import invariant from "tiny-invariant";
import { selectTransSub } from "~/.server/db-queries/transformerSubstationTable";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import LinkToTransSub from "~/components/LinkToTransSub";
import loadPrivateData from "./.server/db-actions/loadPrivateData";
import updatePrivateData from "./.server/db-actions/changePrivateData";
import Form from "./Form";
import Input from "./Input";

export const loader = async ({
  params
}: LoaderFunctionArgs) => {
  invariant(params.transSubId, 'Expected params.transSubId');

  if (!Number(params.transSubId)) {
    throw new Response('Not Found', { status: 404 });
  }

  const transSub = await selectTransSub(params.transSubId);

  if (!transSub) {
    throw new Response('Not Found', { status: 404 });
  }

  const privateData = await loadPrivateData(transSub.id);

  return json({ transSub, privateData });
};

export const action = async ({
  request, params
}: ActionFunctionArgs) => {
  invariant(params.transSubId, 'Expected params.transSubId');
  const formData = await request.formData();
  const { _action, ...values } = Object.fromEntries(formData);
  values.id = params.transSubId;

  if (_action === 'changePrivate') {
    await updatePrivateData(values);

  }

  return null;
};

export default function ChangeData() {
  const { transSub, privateData } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  return (
    <main>
      <LinkToTransSub
        id={transSub.id}
        name={transSub.name} />
      <div role="tablist" className="tabs tabs-lifted ml-5 mr-5">
        <input type="radio" name="my_tabs_2" role="tab" className="tab" aria-label="БЫТ" />
        <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
          <Form fetcher={fetcher}>
            <div className="join join-vertical gap-2">
              <h2 className="join-item text-center">Всего счетчиков</h2>
              <Input
                label="Количество ПУ"
                name="totalMeters"
                defValue={privateData.totalMeters.quantity} />

              <Input
                label="Из них в системе"
                name="inSystemTotal"
                defValue={privateData.totalMeters.addedToSystem} />
            </div>

            <div className="join join-vertical gap-2">
              <h2 className="join-item text-center">Установлено за год</h2>
              <Input
                label="Количество ПУ"
                name="yearTotal"
                defValue={privateData.totalYearMeters.quantity} />

              <Input
                label="Из них в системе"
                name="inSystemYear"
                defValue={privateData.totalYearMeters.addedToSystem} />
            </div>

            <div className="join join-vertical gap-2">
              <h2 className="join-item text-center">Установлено в этом месяце</h2>
              <Input
                label="Количество ПУ"
                name="monthTotal"
                defValue={privateData.totalMonthMeters.quantity} />

              <Input
                label="Из них в системе"
                name="isSystemMonth"
                defValue={privateData.totalMonthMeters.addedToSystem} />
            </div>

            <div className="join join-vertical gap-5">
              <h2 className="join-item text-center">Вышедшие из строя</h2>
              <Input
                label="Количество ПУ"
                name="failedMeters"
                defValue={privateData.failedMeters} />
              
              <button
                type="submit"
                className="btn btn-outline btn-accent"
                name="_action"
                value='changePrivate'
              >
                Изменить данные
              </button>
            </div>
          </Form>
        </div>

        <input
          type="radio"
          name="my_tabs_2"
          role="tab"
          className="tab"
          aria-label="ЮР"
          defaultChecked />
        <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
          Tab content 2
        </div>

        <input
          type="radio"
          name="my_tabs_2"
          role="tab"
          className="tab"
          aria-label="ОДПУ" />
        <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
          Tab content 3
        </div>

        <input
          type="radio"
          name="my_tabs_2"
          role="tab"
          className="tab"
          aria-label="Техучеты"
          defaultChecked />
        <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
          Tab content 4
        </div>

        <input
          type="radio"
          name="my_tabs_2"
          role="tab"
          className="tab"
          aria-label="Юр отключенные"
          defaultChecked />
        <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
          Tab content 5
        </div>
      </div>
    </main>
  );
}
