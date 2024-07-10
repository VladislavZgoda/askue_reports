import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import {
  useLoaderData,
  useFetcher
} from '@remix-run/react';
import { selectTransSub } from '~/.server/db-queries/transformerSubstationTable';
import invariant from 'tiny-invariant';

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
      <h1 className='text-center mb-3 mt-2 font-bold text-xl'>
        {transSub.name}
      </h1>

      <div className='flex justify-around'>
        <section className='flex flex-col gap-3 bg-base-200 p-5 rounded-lg'>
          <h2>Добавить новые потребительские ПУ</h2>
          <fetcher.Form className='flex flex-col gap-5 h-full'>
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">
                  Количество новых ПУ
                </span>
              </div>
              <input
                type="number"
                min='0'
                placeholder="0"
                className="input input-bordered w-full max-w-xs"
                aria-label='Количество новых ПУ'
                name='newMeters'
              />
            </label>

            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">
                  Из них добавлено в систему
                </span>
              </div>
              <input
                type="number"
                min='0'
                placeholder="0"
                className="input input-bordered w-full max-w-xs"
                aria-label='Из них добавлено в систему'
                name='addedToSystem'
              />
            </label>

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
          <h2>Добавить техучеты</h2>
          <fetcher.Form className='flex flex-col gap-5 h-full'>
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">
                  Количество Техучетов
                </span>
              </div>
              <input
                type="number"
                min='0'
                placeholder="0"
                className="input input-bordered w-full max-w-xs"
                aria-label='Количество Техучетов'
                name='techMeters'
              />
            </label>

            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">
                  Из них под напряжением
                </span>
              </div>
              <input
                type="number"
                min='0'
                placeholder="0"
                className="input input-bordered w-full max-w-xs"
                aria-label='Из них под напряжением'
                name='underVoltage'
              />
            </label>

            <button className="btn btn-outline btn-success mt-auto">
              Добавить
            </button>
          </fetcher.Form>
        </section>

        <section className='flex flex-col gap-3 bg-base-200 p-5 rounded-lg'>
          <h2>Добавить вышедшие из строя ПУ</h2>
          <fetcher.Form className='flex flex-col gap-5 h-full'>
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">
                  Количество вышедших из строя ПУ
                </span>
              </div>
              <input
                type="number"
                min='0'
                placeholder="0"
                className="input input-bordered w-full max-w-xs"
                aria-label='Количество вышедших из строя ПУ'
                name='brokenMeters'
              />
            </label>

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
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">
                  Количество отключенных ПУ
                </span>
              </div>
              <input
                type="number"
                min='0'
                placeholder="0"
                className="input input-bordered w-full max-w-xs"
                aria-label='Количество Техучетов'
                name='disabledMeters'
              />
            </label>

            <button className="btn btn-outline btn-success mt-auto">
              Добавить
            </button>
          </fetcher.Form>
        </section>
      </div>
    </main>
  );
}
