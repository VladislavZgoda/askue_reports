import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const differenceError = `Поле 'Количество ПУ' не должно быть меньше,
      чем поле 'Из них добавлено в систему'.`;

export const billingFormSchema = z
  .object({
    totalCount: z.number({ error: "Введите число." }).int().gte(0),
    registeredCount: z.number({ error: "Введите число." }).int().gte(0),
    yearlyTotalInstalled: z.number({ error: "Введите число." }).int().gte(0),
    yearlyRegisteredCount: z.number({ error: "Введите число." }).int().gte(0),
    monthlyTotalInstalled: z.number({ error: "Введите число." }).int().gte(0),
    monthlyRegisteredCount: z.number({ error: "Введите число." }).int().gte(0),
    balanceGroup: z.literal([
      "Быт",
      "ЮР Sims",
      "ЮР П2",
      "ОДПУ Sims",
      "ОДПУ П2",
    ]),
  })
  .check((ctx) => {
    const {
      totalCount,
      registeredCount,
      yearlyTotalInstalled,
      yearlyRegisteredCount,
      monthlyTotalInstalled,
      monthlyRegisteredCount,
    } = ctx.value;

    if (registeredCount > totalCount) {
      ctx.issues.push({
        code: "custom",
        message: differenceError,
        input: totalCount,
        path: ["totalCount"],
      });

      ctx.issues.push({
        code: "custom",
        message: differenceError,
        input: registeredCount,
        path: ["registeredCount"],
      });
    }
    if (yearlyRegisteredCount > yearlyTotalInstalled) {
      ctx.issues.push({
        code: "custom",
        message: differenceError,
        input: yearlyTotalInstalled,
        path: ["yearlyTotalInstalled"],
      });

      ctx.issues.push({
        code: "custom",
        message: differenceError,
        input: yearlyRegisteredCount,
        path: ["yearlyRegisteredCount"],
      });
    }
    if (monthlyRegisteredCount > monthlyTotalInstalled) {
      ctx.issues.push({
        code: "custom",
        message: differenceError,
        input: monthlyTotalInstalled,
        path: ["monthlyTotalInstalled"],
      });

      ctx.issues.push({
        code: "custom",
        message: differenceError,
        input: monthlyRegisteredCount,
        path: ["monthlyRegisteredCount"],
      });
    }
  })
  .readonly();

export const billingFormResolver = zodResolver(billingFormSchema);

export type BillingFormData = z.infer<typeof billingFormSchema>;
