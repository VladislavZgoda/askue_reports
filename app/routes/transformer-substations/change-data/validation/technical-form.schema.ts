import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import type { FieldErrors } from "react-hook-form";

const differenceError = `Поле 'Количество ПУ' не должно быть меньше,
      чем поле 'Из них под напряжением'.`;

export const technicalFormSchema = z
  .object({
    quantity: z.number({ error: "Введите число." }).int().gte(0),
    underVoltage: z.number({ error: "Введите число." }).int().gte(0),
  })
  .superRefine((val, ctx) => {
    if (val.underVoltage > val.quantity) {
      ctx.addIssue({
        code: "custom",
        message: differenceError,
        path: ["quantity"],
      });

      ctx.addIssue({
        code: "custom",
        message: differenceError,
        path: ["underVoltage"],
      });
    }
  });

export const technicalFormResolver = zodResolver(technicalFormSchema);

export type TechnicalFormData = z.infer<typeof technicalFormSchema>;
export type TechnicalFormErrors = FieldErrors<TechnicalFormData>;
