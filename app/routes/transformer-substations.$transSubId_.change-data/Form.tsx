import type { FetcherWithComponents } from "react-router";

type FormType = {
  children: React.ReactNode;
  fetcher: FetcherWithComponents<{
    errors: {
      [k: string]: string;
    };
  } | null>
};

export default function Form({
  children, fetcher
}: FormType) {
  return (
    <fetcher.Form method="post" className="flex gap-8">
      {children}
    </fetcher.Form>
  );
}
