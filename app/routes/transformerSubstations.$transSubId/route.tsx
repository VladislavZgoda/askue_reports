import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { selectTransSub } from '~/.server/db-queries/transformerSubstationTable';
import invariant from 'tiny-invariant';
import StatTable from './StatTable';
import NavigateForm from './NavigateForm';
import DateInput from '~/components/DateInput';
import loadData from './.server/loadData';

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

  const data = await loadData({ id: transSub.id })

  return json({ transSub, data });
};

export default function TransformerSubstation() {
  const { transSub, data } = useLoaderData<typeof loader>();
  const onDelete = (e: React.FormEvent) => {
    const response = confirm(
      'Подтвердите удаление.'
    );
    if (!response) {
      e.preventDefault();
    }
  };

  return (
    <main className='m-2'>
      <section className='flex justify-between w-[60%]'>
        <ul className="menu bg-base-200 rounded-box w-96 menu-lg row-span-1">
          <li>
            <h2 className="menu-title">{transSub.name}</h2>
            <ul>
              <li>
                <NavigateForm
                  actionName='addData'
                  btnText='Добавить данные'
                  onDelete={undefined}
                  methodType='get' />
              </li>
              <li>
                <NavigateForm
                  actionName='changeData'
                  btnText='Изменить данные'
                  onDelete={undefined}
                  methodType='get' />
              </li>
              <li>
                <NavigateForm
                  actionName='edit'
                  btnText='Переименовать ТП'
                  onDelete={undefined}
                  methodType='get' />
              </li>
              <li>
                <NavigateForm
                  actionName='destroy'
                  btnText='Удалить ТП'
                  onDelete={onDelete}
                  methodType='post' />
              </li>
            </ul>
          </li>
        </ul>

        <Form className='flex flex-col bg-base-200 px-10 py-5 rounded-md gap-2'>
          <p>Выберете даты для данных</p>
          <DateInput labelText='БЫТ' inputName='privateDate' />
          <DateInput labelText='ЮР' inputName='legalDate' />
          <DateInput labelText='ОДПУ' inputName='odpyDate' />
        </Form>
      </section>

      <section className='mt-2 w-[60%]'>
        <StatTable data={data} />
      </section>
    </main>
  );
}
