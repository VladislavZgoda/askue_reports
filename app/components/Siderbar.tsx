import {
  Form,
  NavLink,
  useSubmit,
  useNavigation
} from "@remix-run/react";
import type { TransSubs } from "~/types";
import { useEffect, useState } from 'react';

export default function Siderbar({ transSubs, q }: TransSubs) {
  const [query, setQuery] = useState(q || '');
  const submit = useSubmit();
  const navigation = useNavigation();
  const searching =
    navigation.location &&
    new URLSearchParams(navigation.location.search).has(
      'q'
    );

  useEffect(() => {
    setQuery(q || '');
  }, [q]);

  const listItems = () => {
    if (transSubs?.length) {
      const cloneTransSubs = structuredClone(transSubs);
      cloneTransSubs.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: 'base'
        })
      );

      const transformerSubstations = cloneTransSubs
        .map(transSub =>
          <li key={transSub.id} className="mb-1.5">
            <NavLink
              to={`/transformer-substations/${transSub.id}`}
              prefetch="intent"
              className={({ isActive, isPending }) =>
                isActive
                  ? 'btn btn-info btn-active btn-wide text-base'
                  : isPending
                  ? 'btn btn-ghost btn-wide text-base btn-active'
                  : 'btn btn-ghost btn-wide text-base'
              }
            >
              {transSub.name}
            </NavLink>
          </li>
        );

      return transformerSubstations;
    } else if (transSubs?.length === undefined) {
      return <li>Ошибка загрузки данных</li>
    } else {
      return <li>Нет записей</li>
    }
  };

  return (
    <div
      className="col-span-1 row-start-2 row-span-3 border-r-2 border-neutral">
      <div className="flex p-3 items-center flex-col justify-between
           border-b-2 border-neutral h-36 flex-initial">
        <Form
          role="search"
          onChange={(e) => {
            const isFirstSearch = q === null;
            submit(e.currentTarget, {
              replace: !isFirstSearch
            });
          }}>
          <label className="input input-bordered input-info flex items-center gap-2">
            <input type="search" className="grow"
              placeholder="Поиск ТП"
              aria-label="Поиск ТП"
              name="q"
              onChange={(e) =>
                setQuery(e.currentTarget.value)
              }
              value={query}
            />
            {searching ? (
              <span className="loading loading-spinner text-info"></span>
            ): (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4 opacity-70">
                  <path
                    fillRule="evenodd"
                    d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                    clipRule="evenodd" />
                </svg>
            )}
          </label>
        </Form>
        <Form method="post" className="flex-initial">
          <button
            type="submit"
            className="btn btn-xs sm:btn-sm md:btn-md btn-outline w-52">
            Добавить ТП
          </button>
        </Form>
      </div>
      <nav className="py-5">
        <ul className="flex overflow-auto flex-col items-center h-[65vh]">
          {listItems()}
          </ul>
      </nav>
    </div>
  );
}
