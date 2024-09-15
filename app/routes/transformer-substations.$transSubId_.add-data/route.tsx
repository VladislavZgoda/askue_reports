import { json } from '@remix-run/node';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { selectTransSub } from '~/.server/db-queries/transformerSubstationTable';
import invariant from 'tiny-invariant';
import DateInput from '~/components/DateInput';
import NumberInput from './NumberInput';
import SelectInput from './SelectInput';
import addNewMeters from './.server/db-actions/addNewMeters';
import type { BalanceType } from '~/types';
import { selectMessages } from '~/.server/db-queries/metersActionLogTable';
import addTechnicalMeters from './.server/db-actions/addTechnicalMeters';
import addDisabledLegalMeters from './.server/db-actions/addDisabledLegalMeters';
import addFailedMeters from './.server/db-actions/addFailedMeters';
import SubmitButton from './SubmitButton';
import validateInputNewMeters from './.server/validation/newMetersInput';
import validateInputTechnicalMeters from './.server/validation/technicalMetersInput';
import validateInputDisabledMeters from './.server/validation/disabledMetersInput';
import validateInputFailedMeters from './.server/validation/failedMetersInput';
import { useEffect, useRef, useState } from 'react';
import FetcherForm from './FetcherForm';
import LinkToTransSub from '~/components/LinkToTransSub';
import Toast from '~/components/Toast';
import { isNotAuthenticated } from '~/.server/services/auth';

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

  const logMessages = await selectMessages(params.transSubId);

  return json({ transSub, logMessages });
};

export const action = async ({
  request, params
}: ActionFunctionArgs) => {
  invariant(params.transSubId, 'Expected params.transSubId');

  const formData = await request.formData();
  const { _action, ...values } = Object.fromEntries(formData);

  if (_action === 'addNewMeters') {
    const errors = validateInputNewMeters(values);

    if (Object.keys(errors).length > 0) {
      return json({ errors });
    }

    const data = {
      transSubId: params.transSubId,
      newMeters: values.newMeters as string,
      addedToSystem: values.addedToSystem as string,
      type: values.type as BalanceType,
      date: values.date as string
    }

    await addNewMeters(data);
  }

  if (_action === 'addTechnicalMeters') {
    const errors = validateInputTechnicalMeters(values);

    if (Object.keys(errors).length > 0) {
      return json({ errors });
    }

    const data = {
      transSubId: params.transSubId,
      techMeters: values.techMeters as string,
      underVoltage: values.underVoltage as string
    };

    await addTechnicalMeters(data);
  }

  if (_action === 'addDisabledLegalMeters') {
    const errors = validateInputDisabledMeters(values);

    if (Object.keys(errors).length > 0) {
      return json({ errors });
    }

    const data = {
      transSubId: params.transSubId,
      disabledMeters: values.disabledMeters as string
    };

    await addDisabledLegalMeters(data);
  }

  if (_action === 'addFailedMeters') {
    const errors = validateInputFailedMeters(values);

    if (Object.keys(errors).length > 0) {
      return json({ errors });
    }

    const data = {
      transSubId: params.transSubId,
      type: values.type as BalanceType,
      brokenMeters: values.brokenMeters as string
    };

    await addFailedMeters(data);
  }

  return null;
};

export default function AddData() {
  const { transSub, logMessages } = useLoaderData<typeof loader>();
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

  const isNewMetersAction = checkWhatForm('addNewMeters');
  const isSubmittingNewMeters = checkFormSubmit(isNewMetersAction);

  const isTechnicalMetersAction = checkWhatForm('addTechnicalMeters');
  const isSubmittingTechnicalMeters = checkFormSubmit(isTechnicalMetersAction);

  const isDisabledMetersAction = checkWhatForm('addDisabledLegalMeters');
  const isSubmittingDisabledLegalMeters = checkFormSubmit(isDisabledMetersAction);

  const isFailedMetersAction = checkWhatForm('addFailedMeters');
  const isSubmittingFailedMeters = checkFormSubmit(isFailedMetersAction);

  const newMetesRef = useRef<HTMLFormElement>(null);
  const technicalMetersRef = useRef<HTMLFormElement>(null);
  const disabledMetersRef = useRef<HTMLFormElement>(null);
  const failedMetersRef = useRef<HTMLFormElement>(null);

  const [
    errNewMeters,
    setErrNewMeters
  ] = useState<{ [k: string]: string }>({});

  const [
    errTechnicalMeters,
    setErrTechnicalMeters
  ] = useState<{ [k: string]: string }>({});

  const [
    errDisabledMeters,
    setErrDisabledMeters
  ] = useState<{ [k: string]: string }>({});

  const [
    errFailedMeters,
    setErrFailedMeters
  ] = useState<{ [k: string]: string }>({});

  const [isVisible, setIsVisible] = useState(false);

  const handleIsVisible = () => {
    setIsVisible(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  };

  useEffect(() => {
    if (!isSubmittingNewMeters
      && !actionErrors?.errors
      && isNewMetersAction) {
      newMetesRef.current?.reset();
      setErrNewMeters({});
      handleIsVisible();
    }

    if (!isSubmittingTechnicalMeters
      && !actionErrors?.errors
      && isTechnicalMetersAction) {
      technicalMetersRef.current?.reset();
      setErrTechnicalMeters({});
      handleIsVisible();
    }

    if (!isSubmittingDisabledLegalMeters
      && !actionErrors?.errors
      && isDisabledMetersAction) {
      disabledMetersRef.current?.reset();
      setErrDisabledMeters({});
      handleIsVisible();
    }

    if (!isSubmittingFailedMeters
      && !actionErrors?.errors
      && isFailedMetersAction) {
      failedMetersRef.current?.reset();
      setErrFailedMeters({});
      handleIsVisible();
    }

    if (actionErrors?.errors
      && isNewMetersAction) {
      setErrNewMeters(actionErrors.errors);
    }

    if (actionErrors?.errors
      && isTechnicalMetersAction) {
      setErrTechnicalMeters(actionErrors.errors);
    }

    if (actionErrors?.errors
      && isDisabledMetersAction) {
      setErrDisabledMeters(actionErrors.errors);
    }

    if (actionErrors?.errors
      && isFailedMetersAction) {
      setErrFailedMeters(actionErrors.errors);
    }
  }, [isSubmittingNewMeters,
      isSubmittingTechnicalMeters,
      isSubmittingDisabledLegalMeters,
      isSubmittingFailedMeters,
      isNewMetersAction,
      isTechnicalMetersAction,
      isDisabledMetersAction,
      isFailedMetersAction,
      actionErrors?.errors,
    ]);

  return (
    <main>
      <LinkToTransSub
        id={transSub.id}
        name={transSub.name}/>

      <div className='flex justify-around'>
        <FetcherForm
          fetcher={fetcher}
          metesRef={newMetesRef}
          h2Title='Добавить новые потребительские ПУ'>

          <NumberInput
            labelName='Количество новых ПУ'
            inputName='newMeters'
            error={
              errNewMeters?.newMeters
              || errNewMeters?.difference
            } />

          <NumberInput
            labelName='Из них добавлено в систему'
            inputName='addedToSystem'
            error={
              errNewMeters?.addedToSystem
              || errNewMeters?.difference
            } />

          <SelectInput error={errNewMeters?.type} />
          <DateInput labelText='Дата' inputName='date' />
          <SubmitButton
            buttonValue='addNewMeters'
            isSubmitting={isSubmittingNewMeters} />
        </FetcherForm>

        <FetcherForm
          fetcher={fetcher}
          metesRef={technicalMetersRef}
          h2Title='Добавить техучеты'>

          <NumberInput
            labelName='Количество Техучетов'
            inputName='techMeters'
            error={
              errTechnicalMeters?.techMeters
              || errTechnicalMeters?.techDif
            } />

          <NumberInput
            labelName='Из них под напряжением'
            inputName='underVoltage'
            error={
              errTechnicalMeters?.underVoltage
              || errTechnicalMeters?.techDif
            } />

          <SubmitButton
            buttonValue='addTechnicalMeters'
            isSubmitting={isSubmittingTechnicalMeters} />
        </FetcherForm>

        <FetcherForm
          fetcher={fetcher}
          metesRef={disabledMetersRef}
          h2Title='Добавить ЮР отключенные'>

          <NumberInput
            labelName='Количество отключенных ПУ'
            inputName='disabledMeters'
            error={errDisabledMeters?.disabledMeters} />

          <SubmitButton
            buttonValue='addDisabledLegalMeters'
            isSubmitting={isSubmittingDisabledLegalMeters} />
        </FetcherForm>

        <FetcherForm
          fetcher={fetcher}
          metesRef={failedMetersRef}
          h2Title='Добавить вышедшие из строя ПУ'>

          <NumberInput
            labelName='Количество вышедших из строя ПУ'
            inputName='brokenMeters'
            error={errFailedMeters?.brokenMeters} />

          <SelectInput error={errFailedMeters?.failedType} />
          <SubmitButton
            buttonValue='addFailedMeters'
            isSubmitting={isSubmittingFailedMeters} />
        </FetcherForm>
      </div>

      <section className='w-96 mt-8 ml-auto mr-auto mb-8'>
        {logMessages.length > 0 && (
          <div className="bg-base-200 collapse">
            <input type="checkbox" className="peer" />
            <div
              className="collapse-title bg-primary text-primary-content
              peer-checked:bg-secondary peer-checked:text-secondary-content">
              Нажмите, чтобы показать/скрыть лог
            </div>
            <div
              className="collapse-content bg-primary text-primary-content
               peer-checked:bg-secondary peer-checked:text-secondary-content">

              <ul>
                {logMessages.map(message =>
                  <li key={message.id}>
                    {message.message}
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </section>

      <Toast
        isVisible={isVisible}
        message='Данные успешно добавлены.' />
    </main>
  );
}
