import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { authenticator } from "~/.server/services/auth";
import { json } from "@remix-run/node";
import { AuthorizationError } from "remix-auth";

export async function loader({ request }: LoaderFunctionArgs) {
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/"
  });
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    return await authenticator.authenticate('user-login', request, {
      successRedirect: "/",
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return json({ error: error.message });
    } else if (error instanceof Response) {
      // Возвращает response 302
      return error;
    }
  }
}

export default function Login() {
  const loginError = useActionData<typeof action>();

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
            className={`input input-bordered ${loginError?.error && 'input-error'}`}
            id="login"
            name="userLogin"
            required />
          {loginError?.error && (
            <div className="label">
              <span className="label-text-alt text-error">{loginError.error}</span>
            </div>
          )}        
        </div>
        <div className="form-control">
          <label htmlFor="password" className="label">
            <span className="label-text">Пароль</span>
          </label>
          <input
            type="password"
            placeholder="пароль"
            className={`input input-bordered ${loginError?.error && 'input-error'}`}
            id="password"
            name="password"
            required />
          {loginError?.error && (
            <div className="label">
              <span className="label-text-alt text-error">{loginError.error}</span>
            </div>
          )}   
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
