import { href, Form, NavLink, useSubmit, useNavigation } from "react-router";
import Button from "./Button";

import type { SiderbarProps } from "~/layout/MainLayout";

export default function Siderbar({
  substations,
  query,
  setQuery,
}: SiderbarProps) {
  const submit = useSubmit();
  const navigation = useNavigation();

  const searching =
    navigation.location &&
    new URLSearchParams(navigation.location.search).has("q");

  const listItems = () => {
    if (substations?.length) {
      const clonedSubstations = structuredClone(substations);

      clonedSubstations.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );

      const transformerSubstations = clonedSubstations.map((substation) => (
        <li key={substation.id} className="mb-1.5">
          <NavLink
            to={href("/transformer-substations/:id", {
              id: substation.id.toString(),
            })}
            prefetch="intent"
            className={({ isActive, isPending }) =>
              isActive
                ? "btn btn-info btn-lg btn-active w-56 shadow-xs shadow-neutral"
                : isPending
                  ? "btn btn-ghost btn-lg btn-active w-56"
                  : "btn btn-ghost btn-lg w-56"
            }
            onClick={() => {
              setQuery("");
            }}
          >
            {substation.name}
          </NavLink>
        </li>
      ));

      return transformerSubstations;
    } else if (substations?.length === undefined) {
      return <li>Ошибка загрузки данных</li>;
    } else {
      return <li>Нет записей</li>;
    }
  };

  return (
    <div className="col-span-1 row-start-2 row-span-3 border-r-2 border-neutral">
      <div
        className="flex p-3 items-center flex-col justify-between
           border-b-2 border-neutral h-36 flex-initial"
      >
        <Form
          role="search"
          onChange={(e) => {
            const isFirstSearch = query === null;

            void submit(e.currentTarget, {
              replace: !isFirstSearch,
            });
          }}
        >
          <label className="input input-info input-lg">
            {searching ? (
              <span className="loading loading-spinner loading-xs text-info"></span>
            ) : (
              <svg
                className="h-[1em] opacity-50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <g
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </g>
              </svg>
            )}

            <input
              type="search"
              placeholder="Поиск ТП"
              aria-label="Поиск ТП"
              name="q"
              onChange={(e) => setQuery(e.target.value)}
              value={query}
            />
          </label>
        </Form>
        <Form method="POST" className="flex-initial">
          <Button type="submit" className="w-56 btn-neutral btn-outline">
            Добавить ТП
          </Button>
        </Form>
      </div>
      <nav className="py-5">
        <ul className="flex overflow-auto flex-col items-center h-[65vh] ml-3">
          {listItems()}
        </ul>
      </nav>
    </div>
  );
}
