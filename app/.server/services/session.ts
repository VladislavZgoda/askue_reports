import { createCookieSessionStorage } from "@remix-run/node";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'loggedUser',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secrets: ['aSdqwe323'],
    secure: process.env.NODE_ENV === 'production'
  },
});
