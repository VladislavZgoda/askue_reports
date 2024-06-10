import logo from '../../public/images/logo.svg';

const Header = () => {
  return (
    <header
      className='
        grid grid-cols-5 items-center
        bg-indigo-100 p-5 col-span-5
        row-span-1 border-b-2 border-gray-300'
    >
      <div
        className='flex col-span-1 items-center justify-self-center w-64
          justify-around rounded-lg bg-teal-600 p-2'
      >
        <img
          className='size-10'
          src={logo}
          alt="Изображение счетчика"
        />

        <h1 className="text-2xl font-bold text-white">
          Отчеты АСКУЭ
        </h1>
      </div>
      <nav className='text-xl col-start-3 col-span-3 mr-6'>
        <menu className='flex justify-between'>
          <li className='rounded-2xl bg-sky-600 hover:bg-blue-700
              p-3 text-white font-semibold '>
            <a href="#">Сформировать отчеты</a>
          </li>
          <li className='rounded-2xl bg-sky-600 p-3 font-semibold
            hover:bg-blue-700 text-white flex items-center'>
            <a href="#">Просмотр данных</a>
          </li>
          <li className='rounded-2xl bg-rose-700
            hover:bg-rose-500 p-3 text-white font-semibold'>
            <a href="#">Выйти</a>
          </li>
        </menu>
      </nav>
    </header>
  );
};

export default Header;
