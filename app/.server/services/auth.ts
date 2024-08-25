import { Authenticator } from "remix-auth";
import { sessionStorage } from "./session";
import { FormStrategy } from "remix-auth-form";
import loginUser from '../helpers/loginUser';

type User = {
  userId: string;
};

export const authenticator = new Authenticator<User>(sessionStorage);

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const userLogin = form.get('userLogin');
    const password = form.get('password');
    const user = await loginUser(userLogin, password);

    return user;
  }),
  'user-login'
);
