import type { LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { selectTransSub } from "~/.server/db-queries/transformerSubstationTable";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import LinkToTransSub from "~/components/LinkToTransSub";
import loadPrivateData from "./.server/db-actions/loadPrivateData";

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

  const privateData = await loadPrivateData(transSub.id);

  return json({ transSub, privateData });
};

export const action = async () => {

};

export default function ChangeData() {
  const { transSub, privateData } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  return (
    <main>
      <LinkToTransSub
        id={transSub.id}
        name={transSub.name}
      />
      <div role="tablist" className="tabs tabs-lifted ml-5 mr-5">
        <input type="radio" name="my_tabs_2" role="tab" className="tab" aria-label="БЫТ" />
        <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
          <fetcher.Form className="flex gap-8">
            <div className="join join-vertical gap-2">
              <h2 className="join-item text-center">Всего счетчиков</h2>
              <label className="form-control w-full max-w-xs join-item">
                <div className="label">
                  <span className="label-text">Количество ПУ</span>
                </div>
                <input
                  type="number"
                  placeholder="0"
                  className="input input-bordered w-full max-w-xs"
                  aria-label="Количество ПУ"
                  defaultValue={privateData.totalMeters.quantity}
                />
              </label>
              <label className="form-control w-full max-w-xs join-item">
                <div className="label">
                  <span className="label-text">Из них в системе</span>
                </div>
                <input
                  type="number"
                  placeholder="0"
                  className="input input-bordered w-full max-w-xs"
                  aria-label="Из них в системе"
                  defaultValue={privateData.totalMeters.addedToSystem}
                />
              </label>
            </div>

            <div className="join join-vertical gap-2">
              <h2 className="join-item text-center">Установлено за год</h2>
              <label className="form-control w-full max-w-xs join-item">
                <div className="label">
                  <span className="label-text">Количество ПУ</span>
                </div>
                <input
                  type="number"
                  placeholder="0"
                  className="input input-bordered w-full max-w-xs"
                  aria-label="Количество ПУ"
                  defaultValue={privateData.totalYearMeters.quantity}
                />
              </label>
              <label className="form-control w-full max-w-xs join-item">
                <div className="label">
                  <span className="label-text">Из них в системе</span>
                </div>
                <input
                  type="number"
                  placeholder="0"
                  className="input input-bordered w-full max-w-xs"
                  aria-label="Из них в системе"
                  defaultValue={privateData.totalYearMeters.addedToSystem}
                />
              </label>
            </div>

            <div className="join join-vertical gap-2">
              <h2 className="join-item text-center">Установлено в этом месяце</h2>
              <label className="form-control w-full max-w-xs join-item">
                <div className="label">
                  <span className="label-text">Количество ПУ</span>
                </div>
                <input
                  type="number"
                  placeholder="0"
                  className="input input-bordered w-full max-w-xs"
                  aria-label="Количество ПУ"
                />
              </label>
              <label className="form-control w-full max-w-xs join-item">
                <div className="label">
                  <span className="label-text">Из них в системе</span>
                </div>
                <input
                  type="number"
                  placeholder="0"
                  className="input input-bordered w-full max-w-xs"
                  aria-label="Из них в системе"
                />
              </label>
            </div>

            <div className="join join-vertical gap-5">
              <h2 className="join-item text-center">Вышедшие из строя</h2>
              <label className="form-control w-full max-w-xs join-item">
                <div className="label">
                  <span className="label-text">Количество ПУ</span>
                </div>
                <input
                  type="number"
                  placeholder="0"
                  className="input input-bordered w-full max-w-xs"
                  aria-label="Количество ПУ"
                />
              </label>
              <button className="btn btn-outline btn-accent">
                Изменить данные
              </button>
            </div>
          </fetcher.Form>
        </div>

        <input
          type="radio"
          name="my_tabs_2"
          role="tab"
          className="tab"
          aria-label="ЮР"
          defaultChecked />
        <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
          Tab content 2
        </div>

        <input
          type="radio"
          name="my_tabs_2"
          role="tab"
          className="tab"
          aria-label="ОДПУ" />
        <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
          Tab content 3
        </div>

        <input
          type="radio"
          name="my_tabs_2"
          role="tab"
          className="tab"
          aria-label="Техучеты"
          defaultChecked />
        <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
          Tab content 4
        </div>

        <input
          type="radio"
          name="my_tabs_2"
          role="tab"
          className="tab"
          aria-label="Юр отключенные"
          defaultChecked />
        <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
          Tab content 5
        </div>
      </div>
    </main>
  );
}
