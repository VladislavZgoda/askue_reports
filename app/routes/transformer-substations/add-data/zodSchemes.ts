import type { FieldErrors } from "react-hook-form";
import * as z from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { todayDate } from "~/utils/dateFunctions";

const billingFormSchema = z.object({
  totalCount: z.number({ error: "Введите число." }).int().gte(0),
  registeredCount: z.number({ error: "Введите число." }).int().gte(0),
  balanceGroup: z.literal(
    ["Быт", "ЮР Sims", "ЮР П2", "ОДПУ Sims", "ОДПУ П2", "Выбрать группу"],
    { error: "Выберете группу." },
  ),
  date: z
    .string()
    .min(1, { error: "Выберете дату." })
    .refine((val) => val <= todayDate(), { error: "Дата в будущем." }),
});

export const billingFormResolver = zodResolver(billingFormSchema);

export type BillingFormData = z.infer<typeof billingFormSchema>;

const billingFormWithoutGroup = billingFormSchema.omit({ balanceGroup: true });

const billingValidationSchema = z
  .object({
    ...billingFormWithoutGroup.shape,
    balanceGroup: z.literal(
      ["Быт", "ЮР Sims", "ЮР П2", "ОДПУ Sims", "ОДПУ П2"],
      {
        error: "Выберете группу.",
      },
    ),
  })
  .check((ctx) => {
    if (ctx.value.registeredCount > ctx.value.totalCount) {
      const message =
        "Поле 'Количество ПУ' не должно быть меньше, чем поле 'Из них добавлено в систему'.";

      ctx.issues.push({
        code: "custom",
        message,
        input: ctx.value.totalCount,
        path: ["totalCount"],
      });

      ctx.issues.push({
        code: "custom",
        message,
        input: ctx.value.registeredCount,
        path: ["registeredCount"],
      });
    }
  })
  .readonly();

export type BillingValidationForm = z.infer<typeof billingValidationSchema>;
export type BillingFormErrors = FieldErrors<BillingValidationForm>;

export const billingValidationFormResolver = zodResolver(
  billingValidationSchema,
);
