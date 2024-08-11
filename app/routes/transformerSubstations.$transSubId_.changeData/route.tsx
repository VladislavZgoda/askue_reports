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
import changeData from "./.server/db-actions/changeData";
import Form from "./Form";
import Input from "./Input";
import Container from "./Container";
import TabPanel from "./TabPanel";
import Button from "./Button";
import BtnInputContainer from "./BtnInputContainer";
import validateInput from "./.server/validation/fieldsDifference";
import { useState, useEffect } from "react";

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
  const errors = validateInput(values);

  if (Object.keys(errors).length > 0) {
    return json({ errors });
  }

  if (_action === 'changePrivate') {
    await changeData({
      ...values,
      type: 'Быт'
    });
  }

  if (_action === 'changeLegalSims') {
    await changeData({
      ...values,
      type: 'ЮР Sims'
    });
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
  const actionErrors = fetcher.data;
  const formAction = fetcher.formData?.get('_action');
  const isSubmitting = fetcher.state === 'submitting';
  const isPrivateData = formAction === 'changePrivate';
  const isSubmittingPrivate = isPrivateData && isSubmitting;
  const isLegalSimsData = formAction === 'changeLegalSims';
  const isSubmittingLegalSims = isLegalSimsData && isSubmitting;
  const [
    privateErrors,
    setPrivateErrors
  ] = useState<{ [k: string]: string }>({});
  const [
    legalSimsErrors,
    setLegalSimsErrors
  ] = useState<{ [k: string]: string }>({});

  useEffect(() => {
    if (actionErrors?.errors && isPrivateData) {
      setPrivateErrors(actionErrors.errors);
    }

    if (actionErrors?.errors && isLegalSimsData) {
      setLegalSimsErrors(actionErrors.errors);
    }

    if (!isSubmittingPrivate
      && !actionErrors?.errors
      && isPrivateData) {
      setPrivateErrors({});
    }

    if (!isSubmittingLegalSims
      && !actionErrors?.errors
      && isLegalSimsData) {
      setLegalSimsErrors({});
    }
  }, [
    actionErrors?.errors,
    isPrivateData,
    isLegalSimsData,
    isSubmittingPrivate,
    isSubmittingLegalSims
  ]);

  const isErrors = (
    errors: { [k: string]: string; }
  ) => {
    return Object.keys(errors).length > 0;
  };

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
                error={privateErrors?.totalDiff}
                defValue={privateData.totalMeters.quantity}
                errors={isErrors(privateErrors)} />

              <Input
                label="Из них в системе"
                name="inSystemTotal"
                error={privateErrors?.totalDiff}
                defValue={privateData.totalMeters.addedToSystem}
                errors={isErrors(privateErrors)} />
            </Container>

            <Container heading="Установлено за год">
              <Input
                label="Количество ПУ"
                name="yearTotal"
                error={privateErrors?.yearDiff}
                defValue={privateData.totalYearMeters.quantity}
                errors={isErrors(privateErrors)} />

              <Input
                label="Из них в системе"
                name="inSystemYear"
                error={privateErrors?.yearDiff}
                defValue={privateData.totalYearMeters.addedToSystem}
                errors={isErrors(privateErrors)} />
            </Container>

            <Container heading="Установлено в этом месяце">
              <Input
                label="Количество ПУ"
                name="monthTotal"
                error={privateErrors?.monthDiff}
                defValue={privateData.totalMonthMeters.quantity}
                errors={isErrors(privateErrors)} />

              <Input
                label="Из них в системе"
                name="inSystemMonth"
                error={privateErrors?.monthDiff}
                defValue={privateData.totalMonthMeters.addedToSystem}
                errors={isErrors(privateErrors)} />
            </Container>

            <BtnInputContainer errors={isErrors(privateErrors)}>
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
                error={legalSimsErrors?.totalDiff}
                defValue={legalSimsData.totalMeters.quantity}
                errors={isErrors(legalSimsErrors)} />

              <Input
                label="Из них в системе"
                name="inSystemTotal"
                error={legalSimsErrors?.totalDiff}
                defValue={legalSimsData.totalMeters.addedToSystem}
                errors={isErrors(legalSimsErrors)} />
            </Container>

            <Container heading="Установлено за год">
              <Input
                label="Количество ПУ"
                name="yearTotal"
                error={legalSimsErrors?.yearDiff}
                defValue={legalSimsData.totalYearMeters.quantity}
                errors={isErrors(legalSimsErrors)} />

              <Input
                label="Из них в системе"
                name="inSystemYear"
                error={legalSimsErrors?.yearDiff}
                defValue={legalSimsData.totalYearMeters.addedToSystem}
                errors={isErrors(legalSimsErrors)} />
            </Container>

            <Container heading="Установлено в этом месяце">
              <Input
                label="Количество ПУ"
                name="monthTotal"
                error={legalSimsErrors?.monthDiff}
                defValue={legalSimsData.totalMonthMeters.quantity}
                errors={isErrors(legalSimsErrors)} />

              <Input
                label="Из них в системе"
                name="inSystemMonth"
                error={legalSimsErrors?.monthDiff}
                defValue={legalSimsData.totalMonthMeters.addedToSystem}
                errors={isErrors(legalSimsErrors)} />
            </Container>

            <BtnInputContainer
              errors={isErrors(legalSimsErrors)}>
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
