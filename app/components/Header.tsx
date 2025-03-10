import logo from "../../images/logo.svg";
import { Link, Form, NavLink } from "react-router";

export default function Header() {
  return (
    <header
      className="grid grid-cols-5 items-center p-5 col-span-5
      row-span-1 border-b-2 border-neutral"
    >
      <Link
        to="/"
        className="flex col-span-1 items-center ml-12 w-64
        justify-around rounded-lg bg-info p-2"
      >
        <img className="size-14" src={logo} alt="Изображение счетчика" />
        <h1 className="text-2xl font-bold text-white">Отчеты АСКУЭ</h1>
      </Link>
      <nav className="text-xl col-start-2 col-span-4 justify-self-center">
        <menu
          className="menu menu-vertical menu-xs sm:menu-sm md:menu-md lg:menu-lg 
              xl:menu-xl lg:menu-horizontal bg-base-200 rounded-box gap-14"
        >
          <li>
            <div>
              <NavLink
                to="/generate-reports"
                role="button"
                className={({
                  isActive,
                }) => `btn btn-info btn-outline btn-xs sm:btn-sm lg:w-64
                md:btn-md lg:btn-lg xl:btn-xl ${isActive && "btn-active"}`}
              >
                <span className="text-xs sm:text-sm md:text-base lg:text-lg">
                  Сформировать отчеты
                </span>
              </NavLink>
            </div>
          </li>
          <li>
            <div>
              <NavLink
                to="/view-data"
                className={({
                  isActive,
                }) => `btn btn-info btn-outline btn-xs sm:btn-sm lg:w-64
                md:btn-md lg:btn-lg xl:btn-xl ${isActive && "btn-active"}`}
                prefetch="intent"
              >
                <span className="text-xs sm:text-sm md:text-base lg:text-lg">
                  Просмотр данных
                </span>
              </NavLink>
            </div>
          </li>
          <li>
            <Form action="logout" method="post">
              <button
                type="submit"
                className="btn btn-error btn-outline btn-xs sm:btn-sm lg:w-64
                md:btn-md lg:btn-lg xl:btn-xl"
              >
                <span className="text-xs sm:text-sm md:text-base lg:text-lg">
                  Выйти
                </span>
              </button>
            </Form>
          </li>
        </menu>
      </nav>
    </header>
  );
}
