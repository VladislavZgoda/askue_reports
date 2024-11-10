import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { selectTransSub } from "~/.server/db-queries/transformerSubstationTable";
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
import Toast from "~/components/Toast";
import validateInput from "./.server/validation/fieldsDifference";
import { useState, useEffect } from "react";
import type { BalanceType } from "~/types";
import loadTechMeters from "./.server/db-actions/loadTechMeters";
import changeTechMeters from "./.server/db-actions/changeTechMeters";
import { isErrors } from "~/helpers/checkErrors";
import loadDisabledLegalMeters from "./.server/db-actions/loadDisabledLegalMeters";
import changeDisabledMeters from "./.server/db-actions/changeDisabledMeters";
import { isNotAuthenticated } from "~/.server/services/auth";

export const loader = async ({
  params, request
}: LoaderFunctionArgs) => {
  invariant(params.transSubId, 'Expected params.transSubId');

  if (!Number(params.transSubId)) {
    throw new Response('Not Found', { status: 404 });
  }

  const transSub = await selectTransSub(params.transSubId);

  if (!transSub) {
    throw new Response('Not Found', { status: 404 });
  }

  await isNotAuthenticated(request);

  const privateData = await loadData(transSub.id, 'Быт');
  const legalSimsData = await loadData(transSub.id, 'ЮР Sims');
  const legalP2Data = await loadData(transSub.id, 'ЮР П2');
  const odpySimsData = await loadData(transSub.id, 'ОДПУ Sims');
  const odpyP2Data = await loadData(transSub.id, 'ОДПУ П2');
  const techMetersData = await loadTechMeters(transSub.id);
  const disabledMetersData = await loadDisabledLegalMeters(transSub.id);

  return {
    transSub,
    privateData,
    legalSimsData,
    legalP2Data,
    odpySimsData,
    odpyP2Data,
    techMetersData,
    disabledMetersData
  };
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
    return { errors };
  }

  const mutateData = async (type: BalanceType) => {
    await changeData({
      ...values,
      type
    });
  };

  switch (_action) {
    case 'changePrivate':
      await mutateData('Быт');
      break;
    case 'changeLegalSims':
      await mutateData('ЮР Sims');
      break;
    case 'changeLegalP2':
      await mutateData('ЮР П2');
      break;
    case 'changeOdpySims':
      await mutateData('ОДПУ Sims');
      break;
    case 'changeOdpyP2':
      await mutateData('ОДПУ П2');
      break;
    case 'changeTechMeters':
      await changeTechMeters(values);
      break;
    case 'changeDisabledMeters':
      await changeDisabledMeters(values);
      break;
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
    techMetersData,
    disabledMetersData
  } = useLoaderData<typeof loader>();

  const fetcher = useFetcher<typeof action>();
  const actionErrors = fetcher.data;
  const formAction = fetcher.formData?.get('_action');
  const isSubmitting = fetcher.state === 'submitting';

  const checkWhatForm = (formBtnName: string) => {
    return formAction === formBtnName;
  };

  const checkFormSubmit = (dataType: boolean) => {
    return dataType && isSubmitting;
  };

  const isPrivateData = checkWhatForm('changePrivate');
  const isSubmittingPrivate = checkFormSubmit(isPrivateData);

  const isLegalSimsData = checkWhatForm('changeLegalSims');
  const isSubmittingLegalSims = checkFormSubmit(isLegalSimsData);

  const isLegalP2Data = checkWhatForm('changeLegalP2');
  const isSubmittingLegalP2 = checkFormSubmit(isLegalP2Data);

  const isOdpySimsData = checkWhatForm('changeOdpySims');
  const isSubmittingOdpySims = checkFormSubmit(isOdpySimsData);

  const isOdpyP2Data = checkWhatForm('changeOdpyP2');
  const isSubmittingOdpyP2 = checkFormSubmit(isOdpyP2Data);

  const isTechMetersData = checkWhatForm('changeTechMeters');
  const isSubmittingTechMeters = checkFormSubmit(isTechMetersData);

  const isDisabledMetersData = checkWhatForm('changeDisabledMeters');
  const isSubmittingDisabledMeters = checkFormSubmit(isDisabledMetersData);

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

  const [isVisible, setIsVisible] = useState(false);

  const handleIsVisible = () => {
    setIsVisible(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  };

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
      handleIsVisible();
    }

    if (!isSubmittingLegalSims
      && !actionErrors?.errors
      && isLegalSimsData) {
      setLegalSimsErrors({});
      handleIsVisible();
    }

    if (!isSubmittingLegalP2
      && !actionErrors?.errors
      && isLegalP2Data) {
      setLegalP2Errors({});
      handleIsVisible();
    }

    if (!isSubmittingOdpySims
      && !actionErrors?.errors
      && isOdpySimsData) {
      setOdpySimsErrors({});
      handleIsVisible();
    }

    if (!isSubmittingOdpyP2
      && !actionErrors?.errors
      && isOdpyP2Data) {
      setOdpyP2Errors({});
      handleIsVisible();
    }

    if (!isSubmittingTechMeters
      && !actionErrors?.errors
      && isTechMetersData) {
      setTechMetersErrors({});
      handleIsVisible();
    }

    if (!isSubmittingDisabledMeters
      && isDisabledMetersData) {
      handleIsVisible();
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
    isSubmittingTechMeters,
    isDisabledMetersData,
    isSubmittingDisabledMeters
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
          <Form fetcher={fetcher}>

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

            <div className={`h-full mt-auto
              ${isErrors(techMetersErrors) ? 'mb-12' : ''}`}>

              <Button
                isSubmitting={isSubmittingTechMeters}
                buttonValue="changeTechMeters" />
            </div>
          </Form>
        </TabPanel>

        <TabPanel label="Юр Отключенные">
          <Form fetcher={fetcher}>

            <div className="flex flex-col justify-between gap-10">
              <div className="flex flex-col gap-2">
                <h2 className="text-center">Количество отключенных</h2>
                <Input
                  label="Количество ПУ"
                  name="quantity"
                  defValue={disabledMetersData} />
              </div>

              <Button
                isSubmitting={isSubmittingDisabledMeters}
                buttonValue="changeDisabledMeters" />
            </div>
          </Form>
        </TabPanel>
      </div>

      <Toast
        isVisible={isVisible}
        message="Данные успешно обновлены." />
    </main>
  );
}
