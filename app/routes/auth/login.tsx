import type { Route } from "./+types/login";
import { Form, redirect, useNavigation } from "react-router";
import { authenticator } from "~/.server/services/auth";
import sessionStorage from "~/.server/services/session";
import { useRemixForm } from "remix-hook-form";
import { resolver } from "./zodLoginSchema";
import type { FormData } from "./zodLoginSchema";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );

  const user = session.get("loggedUser") as string | undefined;

  if (user) return redirect("/");

  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const userIdOrError = await authenticator.authenticate("user-login", request);

  if (typeof userIdOrError === "object") {
    return userIdOrError;
  }

  const session = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );

  session.set("loggedUser", userIdOrError);

  return redirect("/", {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}

export default function Login() {
  const {
    handleSubmit,
    formState: { errors },
    register,
  } = useRemixForm<FormData>({
    mode: "onSubmit",
    resolver,
  });

  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <main className="flex flex-col items-center gap-5 w-full max-h-screen">
      <h1 className="text-4xl font-bold underline text-neutral">
        Отчеты АСКУЭ
      </h1>
      <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
        <Form onSubmit={void handleSubmit} method="POST" className="card-body">
          <fieldset className="fieldset w-xs">
            <label htmlFor="login" className="fieldset-label text-base">
              Логин
            </label>
            <input
              {...register("login")}
              type="text"
              placeholder="Имя пользователя"
              autoComplete="login"
              className={`input ${errors?.login && "input-error"}`}
              id="login"
              name="login"
            />
            {errors?.login && (
              <div className="fieldset-label text-error">
                {errors.login.message}
              </div>
            )}

            <label htmlFor="password" className="fieldset-label text-base">
              Пароль
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="Пароль"
              autoComplete="current-password"
              className={`input ${errors?.password && "input-error"}`}
              id="password"
              name="password"
            />
            {errors?.password && (
              <div className="fieldset-label text-error">
                {errors.password.message}
              </div>
            )}

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
