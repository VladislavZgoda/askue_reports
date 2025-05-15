import * as zod from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = zod.object({
  login: zod.string().min(1, { message: "Пустое поле" }),
  password: zod.string().min(1, { message: "Пустое поле" }),
});

export const resolver = zodResolver(schema);
export type FormData = zod.infer<typeof schema>;
