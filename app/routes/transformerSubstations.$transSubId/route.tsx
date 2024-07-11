import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { selectTransSub } from '~/.server/db-queries/transformerSubstationTable';
import invariant from 'tiny-invariant';
import StatTable from './StatTable';

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

export default function TransformerSubstation() {
  const { transSub } = useLoaderData<typeof loader>();

  return (
    <main className='m-2'>
      <section
        className='flex justify-between w-[60%]'
      >
        <ul className="menu bg-base-200 rounded-box w-96 menu-lg row-span-1">
          <li>
            <h2 className="menu-title">{transSub.name}</h2>
            <ul>
              <li>
                <Form action='AddData'>
                  <button type='submit'>Добавить данные</button>
                </Form>
              </li>
              <li>
                <a>Изменить данные</a>
              </li>
              <li>
                <Form action='edit'>
                  <button type='submit'>Переименовать ТП</button>
                </Form>
              </li>
              <li>
                <Form
                  action='destroy'
                  method='post'
                  onSubmit={(e) => {
                    const response = confirm(
                      'Подтвердите удаление.'
                    );
                    if (!response) {
                      e.preventDefault();
                    }
                  }}
                >
                  <button type='submit'>Удалить ТП</button>
                </Form>
              </li>
            </ul>
          </li>
        </ul>

        <Form
          className='flex flex-col bg-base-200 px-10 py-5 rounded-md gap-2'
        >
          <p>Выберете даты для данных</p>
          <div className='flex flex-col gap-1'>
            <label htmlFor="private">БЫТ</label>
            <input
              type="date"
              name='privateDate'
              id='private'
              className='p-1 rounded-md bg-base-100 border-info border-[1px]'
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label htmlFor="legal">ЮР</label>
            <input
              type="date"
              name='legalDate'
              id='legal'
              className='p-1 rounded-md bg-base-100 border-info border-[1px]'
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label htmlFor="odpy">ОДПУ</label>
            <input
              type="date"
              name='odpyDate'
              id='odpy'
              className='p-1 rounded-md bg-base-100 border-info border-[1px]'
            />
          </div>
        </Form>
      </section>

      <section className='mt-2 w-[60%]'>
        <StatTable />
      </section>
    </main>
  );
}
