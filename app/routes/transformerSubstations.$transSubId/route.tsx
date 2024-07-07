import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { selectTransSub } from '~/.server/db-queries/transformerSubstationTable';
import invariant from 'tiny-invariant';
import StatRow from './StatRow';

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
      <section>
        <ul className="menu bg-base-200 rounded-box w-96 menu-lg row-span-1">
          <li>
            <h2 className="menu-title">{transSub.name}</h2>
            <ul>
              <li>
                <a>Добавить данные</a>
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

        <Form className='flex flex-col'>
          <p>Выберете даты для данных</p>
          <div>
            <label htmlFor="private">БЫТ</label>
            <input
              type="date"
              name='privateDate'
              id='private'
            />
          </div>
          <div>
            <label htmlFor="legal">ЮР</label>
            <input
              type="date"
              name='legalDate'
              id='legal'
            />
          </div>
          <div>
            <label htmlFor="odpy">ОДПУ</label>
            <input
              type="date"
              name='odpyDate'
              id='odpy'
            />
          </div>
        </Form>
      </section>

      <section>
        <StatRow data={{
          title1: 'Всего ПУ',
          value1: '0',
          date1: '07-07-2024',
          title2: 'Всего ПУ в работе',
          value2: '0',
          date2: '07-07-2024',
          title3: 'Всего Техучетов',
          value3: '0',
          date3: '07-07-2024',
          title4: 'Техучеты не под напряжением',
          value4: '0',
          date4: '07-07-2024'
        }} />

        <StatRow data={{
          title1: 'Всего БЫТ',
          value1: '0',
          date1: '07-07-2024',
          title2: 'БЫТ в работе',
          value2: '0',
          date2: '07-07-2024',
          title3: 'Всего ЮР',
          value3: '0',
          date3: '07-07-2024',
          title4: 'ЮР в работе',
          value4: '0',
          date4: '07-07-2024'
        }} />

        <StatRow data={{
          title1: 'Всего ОДПУ',
          value1: '0',
          date1: '07-07-2024',
          title2: 'ОДПУ в работе',
          value2: '0',
          date2: '07-07-2024',
          title3: 'ЮР Sims',
          value3: '0',
          date3: '07-07-2024',
          title4: 'ЮР П2',
          value4: '0',
          date4: '07-07-2024'
        }} />

        <StatRow data={{
          title1: 'ОДПУ Sims',
          value1: '0',
          date1: '07-07-2024',
          title2: 'ОДПУ П2',
          value2: '0',
          date2: '07-07-2024',
          title3: 'ОДПУ Sims неисправно',
          value3: '0',
          date3: '07-07-2024',
          title4: 'ОДПУ П2 неисправно',
          value4: '0',
          date4: '07-07-2024'
        }} />

        <StatRow data={{
          title1: 'БЫТ неисправно',
          value1: '0',
          date1: '07-07-2024',
          title2: 'ЮР Sims неисправно',
          value2: '0',
          date2: '07-07-2024',
          title3: 'ЮР П2 неисправно',
          value3: '0',
          date3: '07-07-2024',
          title4: 'ЮР П2 отключено',
          value4: '0',
          date4: '07-07-2024'
        }} />
      </section>
    </main>
  );
}
