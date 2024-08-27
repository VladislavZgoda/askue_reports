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
    secure: process.env.NODE_ENV === 'production'
  },
});