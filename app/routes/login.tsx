import type { Route } from "./+types/login";
import { Form, redirect, useNavigation, useActionData } from "react-router";
import { authenticator } from "~/.server/services/auth";
import sessionStorage from "~/.server/services/session";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );
  const user = session.get("loggedUser");
  if (user) throw redirect("/");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const requestClone = request.clone();

  const user = await authenticator.authenticate("user-login", request);

  if (!user[0]?.userId) {
    const formData = await requestClone.formData();
    const userLogin = formData.get("userLogin") as string;

    return {
      errorMessage: "Не верный логин/пароль",
      userLogin,
    };
  }

  const session = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );
  session.set("loggedUser", user[0].userId);

  throw redirect("/", {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}

export default function Login() {
  const loginData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <main className="flex flex-col items-center gap-5 w-full max-h-screen">
      <h1 className="text-4xl font-bold underline text-neutral">Отчеты АСКУЭ</h1>
      <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
        <Form className="card-body" method="post">
          <fieldset className="fieldset w-xs">
            <label htmlFor="login" className="fieldset-label text-base">
              Логин
            </label>
            <input
              type="text"
              placeholder="логин"
              autoComplete="username"
              className={`input ${loginData?.errorMessage && "input-error"}`}
              id="login"
              name="userLogin"
              defaultValue={loginData?.errorMessage && loginData?.userLogin}
              required
            />
            {loginData?.errorMessage && (
              <div className="fieldset-label text-error">
                {loginData.errorMessage}
              </div>
            )}

            <label htmlFor="password" className="fieldset-label text-base">
              Пароль
            </label>
            <input
              type="password"
              placeholder="пароль"
              autoComplete="current-password"
              className={`input ${loginData?.errorMessage && "input-error"}`}
              id="password"
              name="password"
              required
            />
            <button
              className={
                isSubmitting
                  ? "btn btn-neutral btn-active mt-4"
                  : "btn btn-neutral mt-4 text-base"
              }
              type={isSubmitting ? "button" : "submit"}
            >
              {isSubmitting && (
                <span className="loading loading-spinner"></span>
              )}
              {isSubmitting ? "Проверка..." : "Войти"}
            </button>
          </fieldset>
        </Form>
      </div>
    </main>
  );
}
