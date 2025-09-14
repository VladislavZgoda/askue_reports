// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: TS7031
export default function urlMiddleware({ request }): void {
  // eslint-disable-next-line
  const url = request.url;
  // eslint-disable-next-line
  const id = new URL(url).pathname.split("/")[2];

  if (!Number(id)) {
    throw new Error("400 Bad Request");
  }
}
