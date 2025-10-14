import { href, Link, Form, NavLink } from "react-router";

import logo from "../../images/logo.svg";
import Button from "./Button";

import type { SetQuery } from "~/layout/MainLayout";

export default function Header({ setQuery }: { setQuery: SetQuery }) {
  const handleLinkClick = () => setQuery("");

  return (
    <header
      className="grid grid-cols-5 items-center p-5 col-span-5
      row-span-1 border-b-2 border-neutral"
    >
      <Link
        to={href("/")}
        className="flex col-span-1 items-center ml-12 w-64
        justify-around rounded-lg bg-info p-2 shadow-md shadow-neutral"
        onClick={handleLinkClick}
      >
        <img className="size-14" src={logo} alt="Изображение счетчика" />
        <h1 className="text-2xl font-bold text-white">Отчеты АСКУЭ</h1>
      </Link>

      <nav className="text-xl col-start-2 col-span-4 justify-self-center">
        <menu
          className="menu menu-vertical menu-xs sm:menu-sm md:menu-md lg:menu-lg 
              xl:menu-xl lg:menu-horizontal bg-base-200 rounded-box gap-14 shadow-lg"
        >
          <li>
            <NavigationLink
              href={href("/generate-reports")}
              onLinkClick={handleLinkClick}
            >
              Сформировать отчеты
            </NavigationLink>
          </li>
          <li>
            <NavigationLink
              href={href("/view-data")}
              onLinkClick={handleLinkClick}
            >
              Просмотр данных
            </NavigationLink>
          </li>
          <li>
            <Form action="logout" method="POST">
              <Button
                type="submit"
                className="lg:w-64 btn-error btn-outline xl:btn-xl"
              >
                <span className="text-xs sm:text-sm md:text-base lg:text-lg">
                  Выйти
                </span>
              </Button>
            </Form>
          </li>
        </menu>
      </nav>
    </header>
  );
}

interface Props {
  href: string;
  children: React.ReactNode;
  onLinkClick: () => void;
}

function NavigationLink({ href, children, onLinkClick }: Props) {
  return (
    <div>
      <NavLink
        to={href}
        prefetch="intent"
        onClick={onLinkClick}
        className={({
          isActive,
        }) => `btn btn-info btn-outline btn-xs sm:btn-sm lg:w-64 md:btn-md lg:btn-lg
                xl:btn-xl ${isActive ? "btn-active shadow-sm shadow-neutral" : ""}`}
      >
        <span className="text-xs sm:text-sm md:text-base lg:text-lg">
          {children}
        </span>
      </NavLink>
    </div>
  );
}
