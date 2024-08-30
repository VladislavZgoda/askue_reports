import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { authenticator } from "~/.server/services/auth";
import { json } from "@remix-run/node";
import { AuthorizationError } from "remix-auth";

export async function loader({ request }: LoaderFunctionArgs) {
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/"
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const requestClone = request.clone();

  try {
    return await authenticator.authenticate('user-login', request, {
      successRedirect: "/",
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      const formData = await requestClone.formData();
      const userLogin = formData.get('userLogin');
      const password = formData.get('password');

      return json({
        error: error.message,
        values: {
          userLogin,
          password
        }
      });
    } else if (error instanceof Response) {
      // Возвращает response 302
      return error;
    }
  }
}

export default function Login() {
  const loginData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <main className="flex flex-col items-center gap-5 w-full">
      <h1 className="text-4xl font-bold underline text-success">
        Отчеты АСКУЭ
      </h1>
      <fieldset disabled={isSubmitting}
        className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
        <Form className="card-body" method="post">
          <div className="form-control">
            <label htmlFor="login" className="label">
              <span className="label-text">Логин</span>
            </label>
            <input
              type="text"
              placeholder="логин"
              className={`input input-bordered ${loginData?.error && 'input-error'}`}
              id="login"
              name="userLogin"
              defaultValue={loginData?.error && loginData.values.userLogin}
              required />
            {loginData?.error && (
              <div className="label">
                <span className="label-text-alt text-error">{loginData.error}</span>
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
              className={`input input-bordered ${loginData?.error && 'input-error'}`}
              id="password"
              name="password"
              defaultValue={loginData?.error && loginData.values.password}
              required />
            {loginData?.error && (
              <div className="label">
                <span className="label-text-alt text-error">{loginData.error}</span>
              </div>
            )}
          </div>
          <div className="form-control mt-6">
            {isSubmitting
              ? (
                <i
                  className="btn btn-outline btn-secondary btn-active not-italic"
                  role="button"
                  tabIndex={0}>
                  <span className="loading loading-spinner"></span>
                  Проверка...
                </i>
              )
              : (
                <button className="btn btn-primary" type="submit">
                  Войти
                </button>
              )}
          </div>
        </Form>
      </fieldset>
    </main>
  );
}
