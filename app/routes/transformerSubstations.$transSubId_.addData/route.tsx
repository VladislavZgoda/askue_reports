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
    const data = {
      transSubId: params.transSubId,
      techMeters: values.techMeters as string,
      underVoltage: values.underVoltage as string
    };

    await addTechnicalMeters(data);
  }

  if (_action === 'addDisabledLegalMeters') {
    const data = {
      transSubId: params.transSubId,
      disabledMeters: values.disabledMeters as string
    };

    await addDisabledLegalMeters(data);
  }

  if (_action === 'addFailedMeters') {
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
  const fetcher = useFetcher();
  const formAction = `/transformerSubstations/${transSub.id}/AddData`;
  const isSubmitting = 
    fetcher.formData?.get('_action') === 'addNewMeters' 
    && fetcher.state === 'submitting'; 

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
          disabled={isSubmitting}
          form='addNewMeters'
        >
          <h2>Добавить новые потребительские ПУ</h2>
          <fetcher.Form
            className='flex flex-col gap-5 h-full'
            method='post'
            action={formAction}
            id='addNewMeters'
          >
            <NumberInput
              labelName={'Количество новых ПУ'}
              inputName={'newMeters'}
            />

            <NumberInput
              labelName={'Из них добавлено в систему'}
              inputName={'addedToSystem'}
            />

            <SelectInput />
            <DateInput />
            <SubmitButton
              buttonValue={'addNewMeters'}
              isSubmitting={isSubmitting} 
            />
            {/* <button
              className="btn btn-outline btn-success mt-auto"
              type='submit'
              name='_action'
              value='addNewMeters'
            >
              {isSubmitting ? <span className="loading loading-spinner"></span> : null}
              {isSubmitting ? `Запись...` : `Добавить`}
            </button> */}
          </fetcher.Form>
        </fieldset>

        <fieldset 
          className='flex flex-col gap-3 bg-base-200 p-5 rounded-lg'
          disabled={isSubmitting}
          form='addTechnicalMeters'
        >
          <h2>Добавить техучеты</h2>
          <fetcher.Form
            className='flex flex-col gap-5 h-full'
            method='post'
            action={formAction}
            id='addTechnicalMeters'
          >
            <NumberInput
                labelName={'Количество Техучетов'}
                inputName={'techMeters'}
            />

            <NumberInput
                labelName={'Из них под напряжением'}
                inputName={'underVoltage'}
            />

            <button
              className="btn btn-outline btn-success mt-auto"
              type='submit'
              name='_action'
              value='addTechnicalMeters'
            >
              Добавить
            </button>
          </fetcher.Form>
        </fieldset>

        <fieldset 
          className='flex flex-col gap-3 bg-base-200 p-5 rounded-lg'
          disabled={isSubmitting}
          form='addDisabledLegalMeters'
        >
          <h2>Добавить ЮР отключенные</h2>
          <fetcher.Form
            className='flex flex-col gap-5 h-full'
            method='post'
            action={formAction}
            id='addDisabledLegalMeters'
          >
            <NumberInput
              labelName={'Количество отключенных ПУ'}
              inputName={'disabledMeters'}
            />

            <button
              className="btn btn-outline btn-success mt-auto"
              type='submit'
              name='_action'
              value='addDisabledLegalMeters'
            >
              Добавить
            </button>
          </fetcher.Form>
        </fieldset>

        <fieldset 
          className='flex flex-col gap-3 bg-base-200 p-5 rounded-lg'
          disabled={isSubmitting}
          form='addFailedMeters'
        >
          <h2>Добавить вышедшие из строя ПУ</h2>
          <fetcher.Form 
            className='flex flex-col gap-5 h-full'
            method='post'
            action={formAction}
            id='addFailedMeters'
          >
            <NumberInput
                labelName={'Количество вышедших из строя ПУ'}
                inputName={'brokenMeters'}
            />

            <SelectInput />

            <button 
              className="btn btn-outline btn-success mt-auto"
              type='submit'
              name='_action'
              value='addFailedMeters'
            >
              Добавить
            </button>
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
