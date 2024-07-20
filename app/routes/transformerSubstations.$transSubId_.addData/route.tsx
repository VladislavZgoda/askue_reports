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
import { addNewMeters } from '~/.server/db-queries/addNewMeters';
import type { BalanceType } from '~/types';
import { selectMessages } from '~/.server/db-queries/metersActionLogTable';

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
  const data = {
    transSubId: params.transSubId,
    newMeters: values.newMeters as string,
    addedToSystem: values.addedToSystem as string,
    type: values.type as BalanceType,
    date: values.date as string
  }

  if (_action === 'addNewMeters') {
    console.log(data);
    await addNewMeters(data);
  }

  return null;
};

export default function AddData() {
  const { transSub, logMessages } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

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
        <section className='flex flex-col gap-3 bg-base-200 p-5 rounded-lg'>
          <h2>Добавить новые потребительские ПУ</h2>
          <fetcher.Form
            className='flex flex-col gap-5 h-full'
            method='post'
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

            <button
              className="btn btn-outline btn-success mt-auto"
              type='submit'
              name='_action'
              value='addNewMeters'
            >
              Добавить
            </button>
          </fetcher.Form>
        </section>

        <section className='flex flex-col gap-3 bg-base-200 p-5 rounded-lg'>
          <h2>Добавить техучеты</h2>
          <fetcher.Form className='flex flex-col gap-5 h-full'>
            <NumberInput
                labelName={'Количество Техучетов'}
                inputName={'techMeters'}
            />

            <NumberInput
                labelName={'Из них под напряжением'}
                inputName={'underVoltage'}
            />

            <button className="btn btn-outline btn-success mt-auto">
              Добавить
            </button>
          </fetcher.Form>
        </section>

        <section className='flex flex-col gap-3 bg-base-200 p-5 rounded-lg'>
          <h2>Добавить ЮР отключенные</h2>
          <fetcher.Form className='flex flex-col gap-5 h-full'>
            <NumberInput
              labelName={'Количество отключенных ПУ'}
              inputName={'disabledMeters'}
            />

            <button className="btn btn-outline btn-success mt-auto">
              Добавить
            </button>
          </fetcher.Form>
        </section>

        <section className='flex flex-col gap-3 bg-base-200 p-5 rounded-lg'>
          <h2>Добавить вышедшие из строя ПУ</h2>
          <fetcher.Form className='flex flex-col gap-5 h-full'>
            <NumberInput
                labelName={'Количество вышедших из строя ПУ'}
                inputName={'brokenMeters'}
            />

            <SelectInput />

            <button className="btn btn-outline btn-success mt-auto">
              Добавить
            </button>
          </fetcher.Form>
        </section>
      </div>

      <section className='w-96 mt-8 ml-auto mr-auto mb-5'>
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
                  </li>)}
              </ul>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
