import type {
  LoaderFunctionArgs,
  ActionFunctionArgs
} from "@remix-run/node";
import invariant from "tiny-invariant";
import { selectTransSub } from "~/.server/db-queries/transformerSubstationTable";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import LinkToTransSub from "~/components/LinkToTransSub";
import loadData from "./.server/db-actions/loadData";
import updatePrivateData from "./.server/db-actions/changePrivateData";
import Form from "./Form";
import Input from "./Input";
import Container from "./Container";
import TabPanel from "./TabPanel";
import Button from "./Button";
import BtnInputContainer from "./BtnInputContainer";
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

  const privateData = await loadData(transSub.id, 'Быт');
  const legalSimsData = await loadData(transSub.id, 'ЮР Sims');
  return json({
    transSub,
    privateData,
    legalSimsData
  });
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
  const {
    transSub,
    privateData,
    legalSimsData
  } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const errors = fetcher.data;
  const formAction = fetcher.formData?.get('_action');
  const isSubmitting = fetcher.state === 'submitting';
  const isPrivateData = formAction === 'changePrivate';
  const isSubmittingPrivate = isPrivateData && isSubmitting;
  const isLegalSimsData = formAction === 'changeLegalSims';
  const isSubmittingLegalSims = isLegalSimsData && isSubmitting;

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

            <BtnInputContainer>
              <Input
                label="Количество ПУ"
                name="failedMeters"
                defValue={privateData.failedMeters} />

              <Button
                buttonValue="changePrivate"
                isSubmitting={isSubmittingPrivate} />
            </BtnInputContainer>
          </Form>
        </TabPanel>

        <TabPanel label="ЮР Sims">
          <Form fetcher={fetcher} isSubmitting={isSubmittingLegalSims}>
            <Container heading="Всего счетчиков">
              <Input
                label="Количество ПУ"
                name="totalMeters"
                error={errors?.legalSimsErrors?.totalDiff}
                defValue={legalSimsData.totalMeters.quantity} />

              <Input
                label="Из них в системе"
                name="inSystemTotal"
                error={errors?.legalSimsErrors?.totalDiff}
                defValue={legalSimsData.totalMeters.addedToSystem} />
            </Container>

            <Container heading="Установлено за год">
              <Input
                label="Количество ПУ"
                name="yearTotal"
                error={errors?.legalSimsErrors?.yearDiff}
                defValue={legalSimsData.totalYearMeters.quantity} />

              <Input
                label="Из них в системе"
                name="inSystemYear"
                error={errors?.legalSimsErrors?.yearDiff}
                defValue={legalSimsData.totalYearMeters.addedToSystem} />
            </Container>

            <Container heading="Установлено в этом месяце">
              <Input
                label="Количество ПУ"
                name="monthTotal"
                error={errors?.legalSimsErrors?.monthDiff}
                defValue={legalSimsData.totalMonthMeters.quantity} />

              <Input
                label="Из них в системе"
                name="inSystemMonth"
                error={errors?.legalSimsErrors?.monthDiff}
                defValue={legalSimsData.totalMonthMeters.addedToSystem} />
            </Container>

            <BtnInputContainer>
              <Input
                label="Количество ПУ"
                name="failedMeters"
                defValue={legalSimsData.failedMeters} />

              <Button
                buttonValue="changeLegalSims"
                isSubmitting={isSubmittingLegalSims} />
            </BtnInputContainer>
          </Form>
        </TabPanel>

        <TabPanel label="ЮР П2">
          Tab content 3
        </TabPanel>

        <TabPanel label="ОДПУ Sims">
          Tab content 4
        </TabPanel>

        <TabPanel label="ОДПУ П2">
          Tab content 5
        </TabPanel>

        <TabPanel label="Техучеты">
          Tab content 6
        </TabPanel>

        <TabPanel label="Юр Отключенные">
          Tab content 7
        </TabPanel>
      </div>
    </main>
  );
}
