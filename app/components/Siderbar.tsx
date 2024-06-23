import { Form } from "@remix-run/react";
import { IoIosSearch } from "react-icons/io";
import type { TransSubs } from "~/types";

const Siderbar = ({ transSubs }: TransSubs) => {
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
          <li key={transSub.id}>
            {transSub.name}
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
      className="col-span-1 row-start-2 row-span-3
       border-r-2 border-neutral"
    >
      <div className="flex p-3 items-center flex-col justify-between
            border-b-2 border-neutral h-40 flex-initial">
        <Form role="search">
          <div
            className="relative flex items-center text-gray-400
                      focus-within:text-neutral flex-initial">
            <IoIosSearch className="w-6 h-6 ml-0.5 mb-1 absolute pointer-events-none"/>
            <input
              type="search"
              placeholder="Поиск"
              aria-label="Поиск ТП"
              className="flex-initial input input-bordered w-full max-w-xs input-xs
              input-accent md:input-md sm:input-sm lg:input-lg placeholder:text-xl"
            />
          </div>
        </Form>
        <Form method="post" className="flex-initial">
          <button
            type="submit"
            className="btn btn-primary btn-xs sm:btn-sm md:btn-md lg:btn-lg"
          >
            Добавить ТП
          </button>
        </Form>
      </div>
      <nav className="py-5">
          <ul className="overflow-auto flex flex-col items-center h-[65vh]">
          {listItems()}
          </ul>
      </nav>
    </div>
  );
};

export default Siderbar;
