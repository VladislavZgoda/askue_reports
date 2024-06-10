import { Form } from "@remix-run/react";
import { IoIosSearch } from "react-icons/io";

const Siderbar = () => {
  return (
    <div
      className="col-span-1 row-start-2 row-span-3
      bg-indigo-100 border-r-2 border-gray-300"
    >
      <div className="flex p-3 items-center flex-col justify-between
            border-b-2 border-gray-300 h-32">
        <Form role="search">
          <div
            className="relative flex items-center text-gray-400
                      focus-within:text-gray-600">
            <IoIosSearch className="w-7 h-8 absolute ml-2 pointer-events-none"/>
            <input
              type="search"
              placeholder="Поиск"
              aria-label="Поиск ТП"
              className="rounded-md pl-10 pr-2 py-2 ring-2 border-none
              ring-gray-300 focus:ring-2 focus:ring-gray-500 text-2xl
              font-semibold"
            />
          </div>
        </Form>
        <Form method="post">
          <button
            type="submit"
            className="bg-white px-4 py-1 rounded-lg text-teal-700
             ml-2 text-2xl border-2 border-gray-300 hover:border-4
           hover:border-teal-700 hover:font-semibold"
          >
            Добавить ТП
          </button>
        </Form>
      </div>
      <nav className="py-5">
          <ul
            className="overflow-auto flex flex-col items-center h-[65vh]"
        >
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
            <li>Test</li>
          </ul>
      </nav>
    </div>
  );
};

export default Siderbar;
