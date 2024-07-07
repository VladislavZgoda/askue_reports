import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
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

export default function TransformerSubstation() {
  const { transSub } = useLoaderData<typeof loader>();

  return (
    <main className='m-2'>
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

      <Form>
        <p>Выберете даты для данных</p>
        <label htmlFor="private">БЫТ</label>
        <input
          type="date"
          name='privateDate'
          id='private'
        />
        <label htmlFor="legal">ЮР</label>
        <input
          type="date"
          name='legalDate'
          id='legal'
        />
        <label htmlFor="odpy">ОДПУ</label>
        <input
          type="date"
          name='odpyDate'
          id='odpy'
        />
      </Form>

      <div className="stats shadow row-span-2">
        <div className="stat place-items-center">
          <div className="stat-title">Всего ПУ</div>
          <div className="stat-value">100</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">Кол-во в работе</div>
          <div className="stat-value">56</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">Всего техучетов</div>
          <div className="stat-value">20</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">Техучеты под напряжением</div>
          <div className="stat-value">24</div>
          <div className="stat-desc">06-07-2024</div>
        </div>
      </div>
      <div className="stats shadow">
        <div className="stat place-items-center">
          <div className="stat-title">Всего БЫТ</div>
          <div className="stat-value">100</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">БЫТ в работе</div>
          <div className="stat-value">56</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">Всего ЮР</div>
          <div className="stat-value">20</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">ЮР в работе</div>
          <div className="stat-value">24</div>
          <div className="stat-desc">06-07-2024</div>
        </div>
      </div>
      <div className="stats shadow">
        <div className="stat place-items-center">
          <div className="stat-title">ЮР Sims</div>
          <div className="stat-value">100</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">Юр Sims в работе</div>
          <div className="stat-value">56</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">ЮР П2</div>
          <div className="stat-value">20</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">ЮР П2 в работе</div>
          <div className="stat-value">24</div>
          <div className="stat-desc">06-07-2024</div>
        </div>
      </div>
      <div className="stats shadow">
        <div className="stat place-items-center">
          <div className="stat-title">Всего ОДПУ</div>
          <div className="stat-value">100</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">ОДПУ в работе</div>
          <div className="stat-value">56</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">ОДПУ П2</div>
          <div className="stat-value">20</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">ОДПУ П2 в работе</div>
          <div className="stat-value">24</div>
          <div className="stat-desc">06-07-2024</div>
        </div>
      </div>
      <div className="stats shadow">
        <div className="stat place-items-center">
          <div className="stat-title">ОДПУ Sims</div>
          <div className="stat-value">100</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">ОДПУ Sims в работе</div>
          <div className="stat-value">56</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">БЫТ сломано</div>
          <div className="stat-value">20</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">ЮР Sims сломано</div>
          <div className="stat-value">24</div>
          <div className="stat-desc">06-07-2024</div>
        </div>
      </div>
      <div className="stats shadow">
        <div className="stat place-items-center">
          <div className="stat-title">ЮР П2 сломано</div>
          <div className="stat-value">100</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">ЮР П2 отключено</div>
          <div className="stat-value">56</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">ОДПУ Sims сломано</div>
          <div className="stat-value">20</div>
          <div className="stat-desc">06-07-2024</div>
        </div>

        <div className="stat place-items-center">
          <div className="stat-title">ОДПУ П2 сломано</div>
          <div className="stat-value">24</div>
          <div className="stat-desc">06-07-2024</div>
        </div>
      </div>
    </main>
  );
}
