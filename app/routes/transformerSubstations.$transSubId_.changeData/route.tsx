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
import Container from "./Container";

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
            <Container heading="Всего счетчиков">
              <Input
                label="Количество ПУ"
                name="totalMeters"
                defValue={privateData.totalMeters.quantity} />

              <Input
                label="Из них в системе"
                name="inSystemTotal"
                defValue={privateData.totalMeters.addedToSystem} />
            </Container>

            <Container heading="Установлено за год">
              <Input
                label="Количество ПУ"
                name="yearTotal"
                defValue={privateData.totalYearMeters.quantity} />

              <Input
                label="Из них в системе"
                name="inSystemYear"
                defValue={privateData.totalYearMeters.addedToSystem} />
            </Container>

            <Container heading="Установлено в этом месяце">
              <Input
                label="Количество ПУ"
                name="monthTotal"
                defValue={privateData.totalMonthMeters.quantity} />

              <Input
                label="Из них в системе"
                name="isSystemMonth"
                defValue={privateData.totalMonthMeters.addedToSystem} />
            </Container>

            <Container heading="Вышедшие из строя">
              <Input
                label="Количество ПУ"
                name="failedMeters"
                defValue={privateData.failedMeters} />

              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>

              <button
                type="submit"
                className="btn btn-outline btn-accent"
                name="_action"
                value='changePrivate'
              >
                Изменить данные
              </button>
            </Container>
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
