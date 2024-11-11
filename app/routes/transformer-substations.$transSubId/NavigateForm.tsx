import { Form } from "@remix-run/react";
import type { FormMethod } from "@remix-run/react";
import React from "react";

type NavigateFormType = {
  actionName: string;
  btnText: string;
  onDelete: ((e: React.FormEvent) => void) | undefined;
  methodType: FormMethod;
};

export default function NavigateForm({
  actionName, btnText, onDelete, methodType
}: NavigateFormType) {
  return (
    <Form action={actionName} method={methodType} onSubmit={onDelete}>
      <button type='submit'>{btnText}</button>
    </Form>
  );
}
