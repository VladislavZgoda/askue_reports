import logo from '../../images/logo.svg';
import { Link, Form } from '@remix-run/react';

const Header = () => {
  return (
    <header
      className='
        grid grid-cols-5 items-center p-5 col-span-5
        row-span-1 border-b-2 border-neutral'
    >
      <Link
        to='/'
        className='flex col-span-1 items-center ml-12 w-64
          justify-around rounded-lg bg-success p-2'
      >
        <img
          className='size-14'
          src={logo}
          alt="Изображение счетчика"
        />
        <h1 className="text-2xl font-bold text-white">
          Отчеты АСКУЭ
        </h1>
      </Link>
      <nav className='text-xl col-start-2 col-span-4 justify-self-center'>
        <menu
          className='menu menu-horizontal bg-base-200 w-full
          rounded-xl gap-14'
        >
          <li>
            <div>
              <a href="#" role="button"
                className="btn btn-info btn-outline md:btn-wide
                btn-xs sm:btn-sm md:btn-md lg:btn-lg">
                Сформировать отчеты
              </a>
            </div>       
          </li>
          <li >
            <div>
            <a href="#" role="button"
              className="btn btn-info btn-outline md:btn-wide
              btn-xs sm:btn-sm md:btn-md lg:btn-lg">
              Просмотр данных
            </a>
            </div>
            
          </li>
          <li>
            <Form action='logout' method='post'>
                <button type='submit'
                        className="btn btn-error btn-outline md:btn-wide
                        btn-xs sm:btn-sm md:btn-md lg:btn-lg">
                  Выйти
                </button> 
            </Form>
          </li>
        </menu>
      </nav>
    </header>
  );
};

export default Header;
