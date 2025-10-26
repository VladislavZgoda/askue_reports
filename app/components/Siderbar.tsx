import { href, Form, NavLink, useSubmit, useNavigation } from "react-router";
import Button from "./Button";

import type { SiderbarProps } from "~/layouts/DashboardLayout";

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
                ? "btn btn-info btn-lg btn-active shadow-neutral w-56 shadow-xs"
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
    <div className="border-neutral col-span-1 row-span-3 row-start-2 border-r-2">
      <div className="border-neutral flex h-36 flex-initial flex-col items-center justify-between border-b-2 p-3">
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
          <Button type="submit" className="btn-neutral btn-outline w-56">
            Добавить ТП
          </Button>
        </Form>
      </div>
      <nav className="py-5">
        <ul className="ml-3 flex h-[65vh] flex-col items-center overflow-auto">
          {listItems()}
        </ul>
      </nav>
    </div>
  );
}
