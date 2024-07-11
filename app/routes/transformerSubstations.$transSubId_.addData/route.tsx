import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import {
  useLoaderData,
  useFetcher
} from '@remix-run/react';
import { selectTransSub } from '~/.server/db-queries/transformerSubstationTable';
import invariant from 'tiny-invariant';
import DateInput from './DateInput';
import NumberInput from './NumberInput';

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

  return json({ transSub });
};

export default function AddData() {
  const { transSub } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <main>
      <h1 className='text-center mb-6 mt-2 font-bold text-xl'>
        {transSub.name}
      </h1>

      <div className='flex justify-around'>
        <section className='flex flex-col gap-3 bg-base-200 p-5 rounded-lg'>
          <h2>Добавить новые потребительские ПУ</h2>
          <fetcher.Form className='flex flex-col gap-5 h-full'>
            <NumberInput 
              labelName={'Количество новых ПУ'}
              inputName={'newMeters'} 
            />

            <NumberInput 
              labelName={'Из них добавлено в систему'}
              inputName={'addedToSystem'} 
            />

            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">
                  Выберете балансовую принадлежность
                </span>
              </div>
              <select
                className="select select-bordered"
                aria-label='Выберете балансовую принадлежность'
                defaultValue={'DEFAULT'}
                name='type'
              >
                <option value='DEFAULT' disabled>Выбрать</option>
                <option value='Быт'>Быт</option>
                <option value='ЮР Sims'>ЮР Sims</option>
                <option value='ЮР П2'>ЮР П2</option>
                <option value='ОДПУ Sims'>ОДПУ Sims</option>
                <option value='ОДПУ П2'>ОДПУ П2</option>
              </select>
            </label>

            <DateInput />

            <button className="btn btn-outline btn-success mt-auto">
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
          <h2>Добавить вышедшие из строя ПУ</h2>
          <fetcher.Form className='flex flex-col gap-5 h-full'>
            <NumberInput 
                labelName={'Количество вышедших из строя ПУ'}
                inputName={'brokenMeters'} 
            />

            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">
                  Выберете балансовую принадлежность
                </span>
              </div>
              <select
                className="select select-bordered"
                aria-label='Выберете балансовую принадлежность'
                defaultValue={'DEFAULT'}
                name='type'
              >
                <option value='DEFAULT' disabled>Выбрать</option>
                <option value='Быт'>Быт</option>
                <option value='ЮР Sims'>ЮР Sims</option>
                <option value='ЮР П2'>ЮР П2</option>
                <option value='ОДПУ Sims'>ОДПУ Sims</option>
                <option value='ОДПУ П2'>ОДПУ П2</option>
              </select>
            </label>

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
      </div>
    </main>
  );
}
