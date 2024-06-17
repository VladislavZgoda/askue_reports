import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  redirect,
  useLoaderData
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import stylesheet from "~/tailwind.css?url";
import MainLayout from "./layout/MainLayout";
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

export default function App() {
  const { transSubs } = useLoaderData<typeof loader>();

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
        <div className="col-start-2 col-span-4 row-start-2 row-span-3">
          <Outlet />
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
