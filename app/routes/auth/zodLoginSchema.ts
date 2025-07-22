import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  login: z.string().min(1, { error: "Пустое поле." }),
  password: z.string().min(1, { error: "Пустое поле." }),
});

export const cookieSchema = z.string();

export const resolver = zodResolver(schema);
export type FormData = z.infer<typeof schema>;
