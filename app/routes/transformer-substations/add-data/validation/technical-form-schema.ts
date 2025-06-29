import type { FieldErrors } from "react-hook-form";
import * as z from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";

const technicalFormSchema = z
  .object({
    quantity: z.number({ error: "Введите число." }).int().gte(0),
    underVoltage: z.number({ error: "Введите число." }).int().gte(0),
  })
  .check((ctx) => {
    if (ctx.value.underVoltage > ctx.value.quantity) {
      const message = `Поле 'Количество Техучетов' не должно быть меньше,
      чем поле 'Из них под напряжением'.`;

      ctx.issues.push({
        code: "custom",
        message,
        input: ctx.value.quantity,
        path: ["quantity"],
      });

      ctx.issues.push({
        code: "custom",
        message,
        input: ctx.value.underVoltage,
        path: ["underVoltage"],
      });
    }
  })
  .readonly();

export type TechnicalForm = z.infer<typeof technicalFormSchema>;
export type TechnicalFormErrors = FieldErrors<TechnicalForm>;

export const technicalFormResolver = zodResolver(technicalFormSchema);
