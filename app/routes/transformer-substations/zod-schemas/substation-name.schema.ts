import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z
    .string()
    .min(3, { error: "Минимальная длина наименования - 3 символа." })
    .max(15, { error: "Максимальная длина наименования - 15 символов." }),
});

export type FormData = z.infer<typeof schema>;

export const resolver = zodResolver(schema);
