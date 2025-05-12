import { Form } from "react-router";
import type { FormMethod } from "react-router";
import React from "react";

interface NavigateFormProps {
  actionName: string;
  btnText: string;
  onDelete: ((e: React.FormEvent) => void) | undefined;
  methodType: FormMethod;
}

export default function NavigateForm({
  actionName,
  btnText,
  onDelete,
  methodType,
}: NavigateFormProps) {
  return (
    <Form action={actionName} method={methodType} onSubmit={onDelete}>
      <button type="submit">{btnText}</button>
    </Form>
  );
}
