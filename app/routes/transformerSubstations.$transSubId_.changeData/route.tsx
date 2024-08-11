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

  return (
    <main>
      <LinkToTransSub
        id={transSub.id}
        name={transSub.name} />
      <div role="tablist" className="tabs tabs-lifted ml-5 mr-5">
        <Panel
          label="БЫТ" checked={true} data={privateData}
          isSubmitting={isSubmittingPrivate} errors={privateErrors}
          fetcher={fetcher} btnValue="changePrivate" />

        <Panel
          label="ЮР Sims" data={legalSimsData}
          isSubmitting={isSubmittingLegalSims} errors={legalSimsErrors}
          fetcher={fetcher} btnValue="changeLegalSims" />

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
