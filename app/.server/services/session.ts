import { createCookieSessionStorage } from "@remix-run/node";

if (!process.env.secret) {
  throw new Error('process.env.secret does not exist');
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'loggedUser',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secrets: [process.env.secret as string],
    maxAge: 259200,       // 3 дня
    secure: true,
  },
});
