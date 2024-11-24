import type { LoaderFunctionArgs, ActionFunctionArgs, HeadersFunction } from '@remix-run/node';
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
import SubmitButton from './SubmitButton';
import validateInputNewMeters from './.server/validation/newMetersInput';
import validateInputTechnicalMeters from './.server/validation/technicalMetersInput';
import { useEffect, useRef, useState } from 'react';
import FetcherForm from './FetcherForm';
import LinkToTransSub from '~/components/LinkToTransSub';
import Toast from '~/components/Toast';
import { isNotAuthenticated } from '~/.server/services/auth';
import { data } from "@remix-run/node";
import createEtagHash from "~/utils/etagHash";
import cache from '~/utils/cache';
import Log from './Log';

export const headers: HeadersFunction = ({ loaderHeaders }) => loaderHeaders;

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

  const hash = createEtagHash({ transSub, logMessages });
  const etag = request.headers.get('If-None-Match');

  if (etag === hash) {
    return new Response(undefined, { status: 304 }) as unknown as {
      transSub: typeof transSub,
      logMessages: typeof logMessages,
    };
  }

  return data({ transSub, logMessages }, {
    headers: {
      "Cache-Control": "no-cache",
      "Etag": hash
    }
  });
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
      return { errors };
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
      return { errors };
    }

    const data = {
      transSubId: params.transSubId,
      techMeters: values.techMeters as string,
      underVoltage: values.underVoltage as string
    };

    await addTechnicalMeters(data);
  }

  const cacheKeys = cache.keys();

  if (cacheKeys.length > 0) {
    cacheKeys.forEach((cacheKey) => {
      if (cacheKey.startsWith('view-data')) cache.removeKey(cacheKey);
      if (cacheKey.startsWith(`transformer-substations${params.transSubId}`)) cache.removeKey(cacheKey);
    })
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

  const newMetesRef = useRef<HTMLFormElement>(null);
  const technicalMetersRef = useRef<HTMLFormElement>(null);

  const [
    errNewMeters,
    setErrNewMeters
  ] = useState<{ [k: string]: string }>({});

  const [
    errTechnicalMeters,
    setErrTechnicalMeters
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

    if (actionErrors?.errors
      && isNewMetersAction) {
      setErrNewMeters(actionErrors.errors);
    }

    if (actionErrors?.errors
      && isTechnicalMetersAction) {
      setErrTechnicalMeters(actionErrors.errors);
    }
  }, [isSubmittingNewMeters,
      isSubmittingTechnicalMeters,
      isNewMetersAction,
      isTechnicalMetersAction,
      actionErrors?.errors,
    ]);

  return (
    <main>
      <LinkToTransSub
        id={transSub.id}
        name={transSub.name}/>

      <div className='flex ml-6 gap-x-8'>
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

        <Log logMessages={logMessages} />
      </div>

      <Toast
        isVisible={isVisible}
        message='Данные успешно добавлены.'
      />
    </main>
  );
}
