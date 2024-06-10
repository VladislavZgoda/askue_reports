import { Form } from "@remix-run/react";

export const action = () => {
  return null;
};

const CreateNewTransformerSubstation = () => {
  return (
    <main
      className="flex flex-initial items-center justify-center
      h-full text-2xl"
    >
      <Form
        method="post"
        className="flex flex-col p-8 h-2/5 w-2/5 flex-initial justify-evenly"
      >
        <div className="flex flex-initial flex-col items-center">
          <label htmlFor="name">Наименование</label>
          <input
            type="text"
            name="name"
            id="name"
            placeholder="ТП-1000"
            className="text-center"
          />
        </div>
        <button type="submit">Создать</button>
        <button type="button">Отменить</button>
      </Form>
    </main>
  );
};

export default CreateNewTransformerSubstation;
