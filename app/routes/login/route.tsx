import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { authenticator } from "~/.server/services/auth";
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

      return {
        error: error.message,
        values: {
          userLogin
        }
      };
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
      <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
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
              required />
          </div>
          <div className="form-control mt-6">
            <button
              className={isSubmitting ? "btn btn-outline btn-secondary btn-active" : "btn btn-primary"}
              type={isSubmitting ? "button" : "submit"}>
              {isSubmitting && <span className="loading loading-spinner"></span>}
              {isSubmitting ? 'Проверка...' : 'Войти'}
            </button>
          </div>
        </Form>
      </div>
    </main>
  );
}
