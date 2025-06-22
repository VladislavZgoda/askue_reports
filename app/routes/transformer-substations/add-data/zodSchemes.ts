import type { FieldErrors } from "react-hook-form";
import * as z from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { todayDate } from "~/utils/dateFunctions";

const billingFormSchema = z
  .object({
    totalCount: z.number({ error: "Введите число." }).int().gte(0),
    registeredCount: z.number({ error: "Введите число." }).int().gte(0),
    balanceGroup: z.literal(
      ["Быт", "ЮР Sims", "ЮР П2", "ОДПУ Sims", "ОДПУ П2", "Выбрать группу"],
      { error: "Выберете группу." },
    ),
    date: z
      .string()
      .min(1, { error: "Выберете дату." })
      .refine((val) => val <= todayDate(), { error: "Дата в будующем." }),
  })
  .check((ctx) => {
    if (ctx.value.registeredCount > ctx.value.totalCount) {
      ctx.issues.push({
        code: "custom",
        message:
          "Поле 'Количество новых ПУ' не должно быть меньше, чем поле 'Из них добавлено в систему'.",
        input: ctx.value,
        path: [ "registeredCount"],
      });
    }
  });

export const billingFormResolver = zodResolver(billingFormSchema);

export type BillingFormData = z.infer<typeof billingFormSchema>;

const billingFormWithoutGroup = billingFormSchema.omit({ balanceGroup: true });

const billingValidationSchema = billingFormWithoutGroup.extend({
  balanceGroup: z.literal(["Быт", "ЮР Sims", "ЮР П2", "ОДПУ Sims", "ОДПУ П2"], {
    error: "Выберете группу.",
  }),
}).readonly();

export type BillingValidationForm = z.infer<typeof billingValidationSchema>;
export type BillingFormErrors = FieldErrors<BillingValidationForm>;

export const billingValidationFormResolver = zodResolver(
  billingValidationSchema,
);
