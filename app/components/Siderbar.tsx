import { Form, NavLink, useSubmit, useNavigation } from "react-router";
import { useEffect, useState } from "react";

export default function Siderbar({ transSubs, q }: TransSubs) {
  const [query, setQuery] = useState(q || "");
  const submit = useSubmit();
  const navigation = useNavigation();
  const searching =
    navigation.location &&
    new URLSearchParams(navigation.location.search).has("q");

  useEffect(() => {
    setQuery(q || "");
  }, [q]);

  const listItems = () => {
    if (transSubs?.length) {
      const cloneTransSubs = structuredClone(transSubs);
      cloneTransSubs.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );

      const transformerSubstations = cloneTransSubs.map((transSub) => (
        <li key={transSub.id} className="mb-1.5">
          <NavLink
            to={`/transformer-substations/${transSub.id}`}
            prefetch="intent"
            className={({ isActive, isPending }) =>
              isActive
                ? "btn btn-info btn-lg btn-active w-56"
                : isPending
                  ? "btn btn-ghost btn-lg btn-active w-56"
                  : "btn btn-ghost btn-lg w-56"
            }
          >
            {transSub.name}
          </NavLink>
        </li>
      ));

      return transformerSubstations;
    } else if (transSubs?.length === undefined) {
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
            const isFirstSearch = q === null;
            submit(e.currentTarget, {
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
              onChange={(e) => setQuery(e.currentTarget.value)}
              value={query}
            />
          </label>
        </Form>
        <Form method="post" className="flex-initial">
          <button
            type="submit"
            className="btn btn-xs sm:btn-sm md:btn-md btn-outline lg:btn-lg btn-neutral w-56"
          >
            Добавить ТП
          </button>
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
