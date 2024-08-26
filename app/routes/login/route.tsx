import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { authenticator } from "~/.server/services/auth";

export async function loader({ request }: LoaderFunctionArgs) {
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/"
  });
}

export async function action({ request }: ActionFunctionArgs) {
  return await authenticator.authenticate('user-login', request, {
    successRedirect: "/"
  });
}

export default function Login() {
  return (
    <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
      <Form className="card-body" method="post">
        <div className="form-control">
          <label htmlFor="login" className="label">
            <span className="label-text">Логин</span>
          </label>
          <input
            type="text"
            placeholder="логин"
            className="input input-bordered"
            id="login"
            name="userLogin"
            required />
        </div>
        <div className="form-control">
          <label htmlFor="password" className="label">
            <span className="label-text">Пароль</span>
          </label>
          <input
            type="password"
            placeholder="пароль"
            className="input input-bordered"
            id="password"
            name="password"
            required />
        </div>
        <div className="form-control mt-6">
          <button className="btn btn-primary" type="submit">
            Войти
          </button>
        </div>
      </Form>
    </div>
  );
}
