import type { FormType } from "~/types";

export default function Form({
  children, fetcher
}: FormType) {
  return (
    <fetcher.Form method="post">
      <fieldset className="flex gap-8">
        {children}
      </fieldset>
    </fetcher.Form>
  );
}
