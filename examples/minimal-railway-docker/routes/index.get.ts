import { readFileSync } from "node:fs";

import { Response, route, Status } from "svarta";

const html = readFileSync("index.html", "utf-8");

export default route.handle(async ({ headers }) => {
  headers.set("cache-control", "public, max-age=3600");
  return new Response(Status.Ok, html);
});
