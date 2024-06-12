import { Form } from "@remix-run/react";

export const action = () => {
  return null;
};

const CreateNewTransformerSubstation = () => {
  return (
    <main
      className="flex flex-initial items-center justify-center
      h-full text-3xl"
    >
      <Form
        method="post"
        className="flex flex-col p-8 h-2/5 w-3/5 flex-initial justify-evenly items-center
        bg-indigo-100 rounded-lg"
      >
        <div
          className="flex flex-initial flex-col items-center font-semibold
          focus-within:text-gray-600 text-teal-700"
        >
          <label htmlFor="name">Наименование</label>
          <input
            type="text"
            name="name"
            id="name"
            placeholder="ТП-1000"
            className="text-center mt-2 border-4 border-teal-700 rounded-md
            py-2 px-1 focus:border-gray-500"
          />
        </div>
        <div className="flex flex-initial justify-evenly w-full text-white font-semibold">
          <button
            type="submit"
            className="max-w-fit bg-sky-600 rounded-md py-2 px-5 hover:bg-blue-700"
          >
            Создать
          </button>
          <button
            type="button"
            className="max-w-fit bg-rose-700 rounded-md py-2 px-2 hover:bg-rose-500"
          >
            Отменить
          </button>
        </div>

      </Form>
    </main>
  );
};

export default CreateNewTransformerSubstation;
