import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  redirect,
  useRouteLoaderData,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import type { LinksFunction, SerializeFrom } from "@remix-run/node";
import { json } from "@remix-run/node";
import stylesheet from "~/tailwind.css?url";
import MainLayout from "./layout/MainLayout";
import type { TransformerSubstation } from "~/.server/db-queries/transformerSubstationTable";
import { selectAllTransSubs } from "./.server/db-queries/transformerSubstationTable";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export const loader = async () => {
  const transSubs = await selectAllTransSubs();
  return json({ transSubs });
};

export const action = () => {
  return redirect('/transformerSubstations/new');
};

export interface TransSubs {
  transSubs: TransformerSubstation[]
}

export const Layout = ({
  children
}: {
  children: React.ReactNode
  }) => {
  const { transSubs } = useRouteLoaderData('root') as SerializeFrom<typeof loader>;

  return (
    <html lang="ru">
      <head>
        <Meta />
        <Links />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Отчеты АСКУЭ</title>
      </head>
      <body
        className="font-sans box-border grid h-
        grid-cols-[24rem_1fr_1fr_1fr_1fr]
        grid-rows-[1fr_2fr_2fr_2fr_2rem]"
      >
        <MainLayout transSubs={transSubs} />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

export default function App() {
  return(
    <div className="col-start-2 col-span-4 row-start-2 row-span-3">
      <Outlet />
    </div>
  );
}

export const ErrorBoundary = () => {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>{ error.name }</h1>
        <p>{error.message}</p>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
};
