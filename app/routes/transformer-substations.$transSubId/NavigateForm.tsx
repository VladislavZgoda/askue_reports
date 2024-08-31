import { Form } from "@remix-run/react";
import type { NavigateFormType } from "~/types";

export default function NavigateForm({
  actionName, btnText, onDelete, methodType
}: NavigateFormType) {
  return (
    <Form
      action={actionName}
      method={methodType}
      onSubmit={onDelete}
    >
      <button type='submit'>{btnText}</button>
    </Form>
  );
}
