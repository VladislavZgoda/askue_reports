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
import validateInput from "./.server/validation/fieldsDifference";
import { useState, useEffect } from "react";
import type { BalanceType } from "~/types";

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

  return json({
    transSub,
    privateData,
    legalSimsData,
    legalP2Data,
    odpySimsData
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

  return null;
};

export default function ChangeData() {
  const {
    transSub,
    privateData,
    legalSimsData,
    legalP2Data,
    odpySimsData
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
  }, [
    actionErrors?.errors,
    isPrivateData,
    isLegalSimsData,
    isSubmittingPrivate,
    isSubmittingLegalSims,
    isLegalP2Data,
    isSubmittingLegalP2,
    isOdpySimsData,
    isSubmittingOdpySims
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
