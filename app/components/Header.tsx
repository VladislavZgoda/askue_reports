import { href, Link, Form, NavLink } from "react-router";

import logo from "../../images/logo.svg";
import Button from "./Button";

import type { SetQuery } from "~/layouts/DashboardLayout";

export default function Header({ setQuery }: { setQuery: SetQuery }) {
  const handleLinkClick = () => setQuery("");

  return (
    <header className="border-neutral col-span-5 row-span-1 grid grid-cols-5 items-center border-b-2 p-5">
      <Link
        to={href("/")}
        className="bg-info shadow-neutral col-span-1 ml-12 flex w-64 items-center justify-around rounded-lg p-2 shadow-md"
        onClick={handleLinkClick}
      >
        <img className="size-14" src={logo} alt="Изображение счетчика" />
        <h1 className="text-2xl font-bold text-white">Отчеты АСКУЭ</h1>
      </Link>

      <nav className="col-span-4 col-start-2 justify-self-center text-xl">
        <menu className="menu menu-vertical menu-xs sm:menu-sm md:menu-md lg:menu-lg xl:menu-xl lg:menu-horizontal bg-base-200 rounded-box gap-14 shadow-lg">
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
                className="btn-error btn-outline xl:btn-xl lg:w-64"
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
        className={({ isActive }) =>
          `btn btn-info btn-outline btn-xs sm:btn-sm md:btn-md lg:btn-lg xl:btn-xl lg:w-64 ${isActive ? "btn-active shadow-neutral shadow-sm" : ""}`
        }
      >
        <span className="text-xs sm:text-sm md:text-base lg:text-lg">
          {children}
        </span>
      </NavLink>
    </div>
  );
}
