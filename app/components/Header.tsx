import logo from '../../images/logo.svg';

const Header = () => {
  return (
    <header
      className='
        grid grid-cols-5 items-center p-5 col-span-5
        row-span-1 border-b-2 border-neutral'
    >
      <div
        className='flex col-span-2 items-center justify-self-start w-64
          justify-around rounded-lg bg-success p-2 ml-14'
      >
        <img
          className='size-14'
          src={logo}
          alt="Изображение счетчика"
        />
        <h1 className="text-2xl font-bold text-white">
          Отчеты АСКУЭ
        </h1>
      </div>
      <nav className='text-xl col-start-3 col-span-3 mr-6'>
        <menu
          className='menu menu-horizontal bg-base-200 w-full
          justify-evenly rounded-xl'
        >
          <li>
            <a
              href="#"
              role="button"
              className="btn btn-info btn-outline md:btn-wide
              btn-xs sm:btn-sm md:btn-md lg:btn-lg"
            >
              Сформировать отчеты
            </a>
          </li>
          <li >
            <a
              href="#"
              role="button"
              className="btn btn-info btn-outline md:btn-wide
              btn-xs sm:btn-sm md:btn-md lg:btn-lg"
            >
              Просмотр данных
            </a>
          </li>
          <li>
            <a
              href="#"
              role="button"
              className="btn btn-error btn-outline md:btn-wide
              btn-xs sm:btn-sm md:btn-md lg:btn-lg"
            >
              Выйти
            </a>
          </li>
        </menu>
      </nav>
    </header>
  );
};

export default Header;
