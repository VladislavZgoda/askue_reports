import { json } from '@remix-run/node';
import type {
  LoaderFunctionArgs,
  ActionFunctionArgs
} from '@remix-run/node';
import {
  useLoaderData,
  useFetcher,
  Link
} from '@remix-run/react';
import { selectTransSub } from '~/.server/db-queries/transformerSubstationTable';
import invariant from 'tiny-invariant';
import DateInput from './DateInput';
import NumberInput from './NumberInput';
import SelectInput from './SelectInput';
import addNewMeters from '~/.server/db-queries/addNewMeters';
import type { BalanceType } from '~/types';
import { selectMessages } from '~/.server/db-queries/metersActionLogTable';
import addTechnicalMeters from '~/.server/db-queries/addTechnicalMeters';
import addDisabledLegalMeters from '~/.server/db-queries/addDisabledLegalMeters';
import addFailedMeters from '~/.server/db-queries/addFailedMeters';
import SubmitButton from './SubmitButton';
import validateInputNewMeters from './validationNewMetersInput';
import validateInputTechnicalMeters from './validationTechnicalMetersInput';
import validateInputDisabledMeters from './validationDisabledMetersInput';
import validateInputFailedMeters from './validationFailedMeters';
import { useEffect, useRef } from 'react';

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

  const logMessages = await selectMessages(params.transSubId);

  return json({ transSub, logMessages });
};

export const action = async ({
  request,
  params
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
  const isSubmittingNewMeters =
    formAction === 'addNewMeters' && isSubmitting;
  const isSubmittingTechnicalMeters =
    formAction === 'addTechnicalMeters' && isSubmitting;
  const isSubmittingDisabledLegalMeters =
    formAction === 'addDisabledLegalMeters' && isSubmitting;
  const isSubmittingFailedMeters =
    formAction === 'addFailedMeters' && isSubmitting;
  const newMetesRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isSubmittingNewMeters) {
      newMetesRef.current?.reset();
    }
  }, [isSubmittingNewMeters])

  return (
    <main>
      <Link
        to={`/transformerSubstations/${transSub.id}`}
        className='link link-neutral'
      >
        <h1 className='text-center mb-6 mt-2 font-bold text-xl'>
          {transSub.name}
        </h1>
      </Link>


      <div className='flex justify-around'>
        <fieldset
          className='flex flex-col gap-3 bg-base-200 p-5 rounded-lg'
          disabled={isSubmittingNewMeters}
          form='addNewMeters'
        >
          <h2>Добавить новые потребительские ПУ</h2>
          <fetcher.Form
            className='flex flex-col gap-5 h-full'
            method='post'
            id='addNewMeters'
            ref={newMetesRef}
          >
            <NumberInput
              labelName={'Количество новых ПУ'}
              inputName={'newMeters'}
              error={
                actionErrors?.errors?.newMeters
                || actionErrors?.errors?.difference
              }
            />
            <NumberInput
              labelName={'Из них добавлено в систему'}
              inputName={'addedToSystem'}
              error={
                actionErrors?.errors?.addedToSystem
                || actionErrors?.errors?.difference
              }
            />
            <SelectInput error={actionErrors?.errors?.type} />
            <DateInput error={actionErrors?.errors?.date} />
            <SubmitButton
              buttonValue={'addNewMeters'}
              isSubmitting={isSubmittingNewMeters}
            />
          </fetcher.Form>
        </fieldset>

        <fieldset
          className='flex flex-col gap-3 bg-base-200 p-5 rounded-lg'
          disabled={isSubmittingTechnicalMeters}
          form='addTechnicalMeters'
        >
          <h2>Добавить техучеты</h2>
          <fetcher.Form
            className='flex flex-col gap-5 h-full'
            method='post'
            id='addTechnicalMeters'
          >
            <NumberInput
              labelName={'Количество Техучетов'}
              inputName={'techMeters'}
              error={
                actionErrors?.errors?.techMeters
                || actionErrors?.errors?.techDif
              }
            />
            <NumberInput
              labelName={'Из них под напряжением'}
              inputName={'underVoltage'}
              error={
                actionErrors?.errors?.underVoltage
                || actionErrors?.errors?.techDif
              }
            />
            <SubmitButton
              buttonValue={'addTechnicalMeters'}
              isSubmitting={isSubmittingTechnicalMeters}
            />
          </fetcher.Form>
        </fieldset>

        <fieldset
          className='flex flex-col gap-3 bg-base-200 p-5 rounded-lg'
          disabled={isSubmittingDisabledLegalMeters}
          form='addDisabledLegalMeters'
        >
          <h2>Добавить ЮР отключенные</h2>
          <fetcher.Form
            className='flex flex-col gap-5 h-full'
            method='post'
            id='addDisabledLegalMeters'
          >
            <NumberInput
              labelName={'Количество отключенных ПУ'}
              inputName={'disabledMeters'}
              error={actionErrors?.errors?.disabledMeters}
            />
            <SubmitButton
              buttonValue={'addDisabledLegalMeters'}
              isSubmitting={isSubmittingDisabledLegalMeters}
            />
          </fetcher.Form>
        </fieldset>

        <fieldset
          className='flex flex-col gap-3 bg-base-200 p-5 rounded-lg'
          disabled={isSubmittingFailedMeters}
          form='addFailedMeters'
        >
          <h2>Добавить вышедшие из строя ПУ</h2>
          <fetcher.Form
            className='flex flex-col gap-5 h-full'
            method='post'
            id='addFailedMeters'
          >
            <NumberInput
              labelName={'Количество вышедших из строя ПУ'}
              inputName={'brokenMeters'}
              error={actionErrors?.errors?.brokenMeters}
            />
            <SelectInput error={actionErrors?.errors?.failedType} />
            <SubmitButton
              buttonValue={'addFailedMeters'}
              isSubmitting={isSubmittingFailedMeters}
            />
          </fetcher.Form>
        </fieldset>
      </div>

      <section className='w-96 mt-8 ml-auto mr-auto mb-8'>
        {logMessages.length > 0 ? (
          <div className="bg-base-200 collapse">
            <input type="checkbox" className="peer" />
            <div
              className="collapse-title bg-primary text-primary-content
              peer-checked:bg-secondary peer-checked:text-secondary-content"
            >
              Нажмите, чтобы показать/скрыть лог
            </div>
            <div
              className="collapse-content bg-primary text-primary-content
               peer-checked:bg-secondary peer-checked:text-secondary-content"
            >
              <ul>
                {logMessages.map(message =>
                  <li key={message.id}>
                    {message.message}
                  </li>
                )}
              </ul>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
