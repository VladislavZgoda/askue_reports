import logo from '../../public/images/logo.svg';

const Header = () => {
  return (
    <header
      className='grid grid-cols-5 items-center
       bg-neutral-200 p-5'
    >
      <div
        className='flex col-span-1 items-center
          justify-between rounded-lg bg-teal-600 p-3'
      >
        <img
          className='size-12'
          src={logo}
          alt="Изображение счетчика"
        />

        <h1 className="text-3xl font-bold text-white">
          Отчеты АСКУЭ
        </h1>
      </div>
      <nav className='text-2xl col-start-3 col-span-3'>
        <menu className='flex justify-between'>
          <li className='rounded-full bg-sky-600 hover:bg-blue-700 p-4 text-white'>
            <a href="#">Сформировать отчеты</a>
          </li>
          <li className='rounded-full bg-sky-600 p-4 hover:bg-blue-700 text-white'>
            <a href="#">Просмотр данных</a>
          </li>
          <li className='rounded-full bg-rose-700 hover:bg-rose-800 p-4 text-white'>
            <a href="#">Выйти</a>
          </li>
        </menu>
      </nav>
    </header>
  );
};

export default Header;
