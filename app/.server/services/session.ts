import { createCookieSessionStorage } from "react-router";

if (!process.env.secret) {
  throw new Error("process.env.secret does not exist");
}

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "loggedUser",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [process.env.secret],
    maxAge: 259200, // 3 дня
  },
});

export default sessionStorage;
