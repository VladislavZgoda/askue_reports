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
import TabPanel from "./TabPanel";
import Panel from "./Panel";
import Form from "./Form";
import Input from "./Input";
import Container from "./Container";
import Button from "./Button";
import validateInput from "./.server/validation/fieldsDifference";
import { useState, useEffect } from "react";
import type { BalanceType } from "~/types";
import loadTechMeters from "./.server/db-actions/loadTechMeters";
import changeTechMeters from "./.server/db-actions/changeTechMeters";
import { isErrors } from "~/helpers/checkErrors";

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
  const legalP2Data = await loadData(transSub.id, 'ЮР П2');
  const odpySimsData = await loadData(transSub.id, 'ОДПУ Sims');
  const odpyP2Data = await loadData(transSub.id, 'ОДПУ П2');
  const techMetersData = await loadTechMeters(transSub.id);

  return json({
    transSub,
    privateData,
    legalSimsData,
    legalP2Data,
    odpySimsData,
    odpyP2Data,
    techMetersData
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

  const mutateData = async (type: BalanceType) => {
    await changeData({
      ...values,
      type
    });
  };

  if (_action === 'changePrivate') {
    await mutateData('Быт');
  }

  if (_action === 'changeLegalSims') {
    await mutateData('ЮР Sims');
  }

  if (_action === 'changeLegalP2') {
    await mutateData('ЮР П2');
  }

  if (_action === 'changeOdpySims') {
    await mutateData('ОДПУ Sims');
  }

  if (_action === 'changeOdpyP2') {
    await mutateData('ОДПУ П2');
  }

  if (_action === 'changeTechMeters') {
    await changeTechMeters(values);
  }

  return null;
};

export default function ChangeData() {
  const {
    transSub,
    privateData,
    legalSimsData,
    legalP2Data,
    odpySimsData,
    odpyP2Data,
    techMetersData
  } = useLoaderData<typeof loader>();

  const fetcher = useFetcher<typeof action>();
  const actionErrors = fetcher.data;
  const formAction = fetcher.formData?.get('_action');
  const isSubmitting = fetcher.state === 'submitting';

  const isPrivateData = formAction === 'changePrivate';
  const isSubmittingPrivate = isPrivateData && isSubmitting;

  const isLegalSimsData = formAction === 'changeLegalSims';
  const isSubmittingLegalSims = isLegalSimsData && isSubmitting;

  const isLegalP2Data = formAction === 'changeLegalP2';
  const isSubmittingLegalP2 = isLegalP2Data && isSubmitting;

  const isOdpySimsData = formAction === 'changeOdpySims';
  const isSubmittingOdpySims = isOdpySimsData && isSubmitting;

  const isOdpyP2Data = formAction === 'changeOdpyP2';
  const isSubmittingOdpyP2 = isOdpyP2Data && isSubmitting;

  const isTechMetersData = formAction === 'changeTechMeters';
  const isSubmittingTechMeters = isTechMetersData && isSubmitting;

  const [
    privateErrors,
    setPrivateErrors
  ] = useState<{ [k: string]: string }>({});

  const [
    legalSimsErrors,
    setLegalSimsErrors
  ] = useState<{ [k: string]: string }>({});

  const [
    legalP2Errors,
    setLegalP2Errors,
  ] = useState<{ [k: string]: string }>({});

  const [
    odpySimsErrors,
    setOdpySimsErrors
  ] = useState<{ [k: string]: string }>({});

  const [
    odpyP2Errors,
    setOdpyP2Errors
  ] = useState<{ [k: string]: string }>({});

  const [
    techMetersErrors,
    setTechMetersErrors
  ] = useState<{ [k: string]: string }>({});

  useEffect(() => {
    if (actionErrors?.errors && isPrivateData) {
      setPrivateErrors(actionErrors.errors);
    }

    if (actionErrors?.errors && isLegalSimsData) {
      setLegalSimsErrors(actionErrors.errors);
    }

    if (actionErrors?.errors && isLegalP2Data) {
      setLegalP2Errors(actionErrors.errors);
    }

    if (actionErrors?.errors && isOdpySimsData) {
      setOdpySimsErrors(actionErrors.errors);
    }

    if (actionErrors?.errors && isOdpyP2Data) {
      setOdpyP2Errors(actionErrors.errors);
    }

    if (actionErrors?.errors && isTechMetersData) {
      setTechMetersErrors(actionErrors.errors);
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

    if (!isSubmittingLegalP2
      && !actionErrors?.errors
      && isLegalP2Data) {
      setLegalP2Errors({});
    }

    if (!isSubmittingOdpySims
      && !actionErrors?.errors
      && isOdpySimsData) {
      setOdpySimsErrors({});
    }

    if (!isSubmittingOdpyP2
      && !actionErrors?.errors
      && isOdpyP2Data) {
      setOdpyP2Errors({});
    }

    if (!isSubmittingTechMeters
      && !actionErrors?.errors
      && isTechMetersData) {
      setTechMetersErrors({});
    }
  }, [
    actionErrors?.errors,
    isPrivateData,
    isLegalSimsData,
    isSubmittingPrivate,
    isSubmittingLegalSims,
    isLegalP2Data,
    isSubmittingLegalP2,
    isOdpySimsData,
    isSubmittingOdpySims,
    isOdpyP2Data,
    isSubmittingOdpyP2,
    isTechMetersData,
    isSubmittingTechMeters
  ]);

  return (
    <main>
      <LinkToTransSub
        id={transSub.id}
        name={transSub.name} />
      <div role="tablist" className="tabs tabs-lifted ml-14 mr-14">
        <Panel
          label="БЫТ" checked={true} data={privateData}
          isSubmitting={isSubmittingPrivate} errors={privateErrors}
          fetcher={fetcher} btnValue="changePrivate" />

        <Panel
          label="ЮР Sims" data={legalSimsData}
          isSubmitting={isSubmittingLegalSims} errors={legalSimsErrors}
          fetcher={fetcher} btnValue="changeLegalSims" />

        <Panel
          label="ЮР П2" data={legalP2Data}
          isSubmitting={isSubmittingLegalP2} errors={legalP2Errors}
          fetcher={fetcher} btnValue="changeLegalP2" />

        <Panel
          label="ОДПУ Sims" data={odpySimsData}
          isSubmitting={isSubmittingOdpySims} errors={odpySimsErrors}
          fetcher={fetcher} btnValue="changeOdpySims" />

        <Panel
          label="ОДПУ П2" data={odpyP2Data}
          isSubmitting={isSubmittingOdpyP2} errors={odpyP2Errors}
          fetcher={fetcher} btnValue="changeOdpyP2" />

        <TabPanel label="Техучеты">
          <Form
            fetcher={fetcher}
            isSubmitting={isSubmittingTechMeters}>

            <Container heading="Всего счетчиков">
              <Input
                label="Количество ПУ"
                name="quantity"
                error={techMetersErrors?.techDiff}
                defValue={techMetersData.quantity}
                errors={isErrors(techMetersErrors)} />

              <Input
                label="Из них под напряжением"
                name="underVoltage"
                error={techMetersErrors?.techDiff}
                defValue={techMetersData.addedToSystem}
                errors={isErrors(techMetersErrors)} />
            </Container>

            <div className="h-full mt-auto">
              <Button
                isSubmitting={isSubmittingTechMeters}
                buttonValue="changeTechMeters" />
            </div>
          </Form>
        </TabPanel>

        <TabPanel label="Юр Отключенные">
          Tab content 7
        </TabPanel>
      </div>
    </main>
  );
}
