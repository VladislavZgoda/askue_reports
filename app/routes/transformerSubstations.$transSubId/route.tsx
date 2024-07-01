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
    <main>
      <ul className="menu bg-base-200 rounded-box w-96 menu-lg m-2">
        <li>
          <h2 className="menu-title">{transSub.name}</h2>
          <ul>
            <li>
              <a>Добавить данные</a>
            </li>
            <li>
              <a>Переименовать ТП</a>
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
    </main>
  );
}


