export default function urlMiddleware({ request }: { request: Request }): void {
  const url = request.url;
  const id = new URL(url).pathname.split("/")[2];

  if (!Number(id)) {
    throw new Error("400 Bad Request");
  }
}
