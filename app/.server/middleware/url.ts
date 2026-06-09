export default function urlMiddleware({ url }: { url: URL }): void {
  const id = new URL(url).pathname.split("/")[2];

  if (!Number(id)) {
    throw new Error("400 Bad Request");
  }
}
