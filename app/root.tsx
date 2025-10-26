import "./app.css";

import {
  href,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  redirect,
  useRouteError,
  isRouteErrorResponse,
} from "react-router";

import { searchTransformerSubstationsByName } from "./.server/db-queries/transformer-substations";

import type { Route } from "./+types/root";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");

  const substations = await searchTransformerSubstationsByName(q);

  return { substations, q };
}

export function action() {
  return redirect(href("/transformer-substations/new"));
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="retro">
      <head>
        <Meta />
        <Links />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Отчеты АСКУЭ</title>
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="text-error mt-5 ml-5 text-2xl">
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div className="text-error mt-5 ml-5 text-2xl">
        <h1>{error.name}</h1>
        <p>{error.message}</p>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}
