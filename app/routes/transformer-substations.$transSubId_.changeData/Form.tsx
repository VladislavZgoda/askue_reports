import type { FormType } from "~/types";

export default function Form({
  children, fetcher, isSubmitting
}: FormType) {
  return (
    <fetcher.Form method="post">
      <fieldset
        className="flex gap-8"
        disabled={isSubmitting}>
        {children}
      </fieldset>
    </fetcher.Form>
  );
}
