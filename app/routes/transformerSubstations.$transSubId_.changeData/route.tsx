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
import TabPanel from "./TabPanel";
import Button from "./Button";
import validateInput from "./.server/validation/fieldsDifference";

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
    const privateErrors = validateInput(values);

    if (Object.keys(privateErrors).length > 0) {
      return json({ privateErrors });
    }

    await updatePrivateData(values);
  }

  return null;
};

export default function ChangeData() {
  const { transSub, privateData } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const errors = fetcher.data;
  const formAction = fetcher.formData?.get('_action');
  const isSubmitting = fetcher.state === 'submitting';
  const isPrivateData = formAction === 'changePrivate';
  const isSubmittingPrivate = isPrivateData && isSubmitting;

  return (
    <main>
      <LinkToTransSub
        id={transSub.id}
        name={transSub.name} />
      <div role="tablist" className="tabs tabs-lifted ml-5 mr-5">
        <TabPanel checked={true} label="БЫТ">
          <Form fetcher={fetcher} isSubmitting={isSubmittingPrivate}>
            <Container heading="Всего счетчиков">
              <Input
                label="Количество ПУ"
                name="totalMeters"
                error={errors?.privateErrors?.totalDiff}
                defValue={privateData.totalMeters.quantity} />

              <Input
                label="Из них в системе"
                name="inSystemTotal"
                error={errors?.privateErrors?.totalDiff}
                defValue={privateData.totalMeters.addedToSystem} />
            </Container>

            <Container heading="Установлено за год">
              <Input
                label="Количество ПУ"
                name="yearTotal"
                error={errors?.privateErrors?.yearDiff}
                defValue={privateData.totalYearMeters.quantity} />

              <Input
                label="Из них в системе"
                name="inSystemYear"
                error={errors?.privateErrors?.yearDiff}
                defValue={privateData.totalYearMeters.addedToSystem} />
            </Container>

            <Container heading="Установлено в этом месяце">
              <Input
                label="Количество ПУ"
                name="monthTotal"
                error={errors?.privateErrors?.monthDiff}
                defValue={privateData.totalMonthMeters.quantity} />

              <Input
                label="Из них в системе"
                name="inSystemMonth"
                error={errors?.privateErrors?.monthDiff}
                defValue={privateData.totalMonthMeters.addedToSystem} />
            </Container>

            <Container heading="Вышедшие из строя">
              <Input
                label="Количество ПУ"
                name="failedMeters"
                error={undefined}
                defValue={privateData.failedMeters} />

              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>

              <Button
                buttonValue="changePrivate"
                isSubmitting={isSubmittingPrivate} />
            </Container>
          </Form>
        </TabPanel>

        <TabPanel checked={false} label="ЮР Sims">
          Tab content 2
        </TabPanel>

        <TabPanel checked={false} label="ЮР П2">
          Tab content 3
        </TabPanel>

        <TabPanel checked={false} label="ОДПУ Sims">
          Tab content 4
        </TabPanel>

        <TabPanel checked={false} label="ОДПУ П2">
          Tab content 5
        </TabPanel>

        <TabPanel checked={false} label="Техучеты">
          Tab content 6
        </TabPanel>

        <TabPanel checked={false} label="Юр Отключенные">
          Tab content 7
        </TabPanel>
      </div>
    </main>
  );
}
