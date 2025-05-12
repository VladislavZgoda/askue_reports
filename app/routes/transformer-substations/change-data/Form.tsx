import type { FetcherWithComponents } from "react-router";

interface FormProps {
  children: React.ReactNode;
  fetcher: FetcherWithComponents<{
    errors: Record<string, string>;
  } | null>;
}

export default function Form({ children, fetcher }: FormProps) {
  return (
    <fetcher.Form method="post" className="flex gap-8">
      {children}
    </fetcher.Form>
  );
}
