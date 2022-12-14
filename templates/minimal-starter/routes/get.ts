import { readFileSync } from "node:fs";

import { Response, route, Status } from "@svarta/core";

const html = readFileSync("index.html", "utf-8");

export default route.handle(async () => {
  return new Response(Status.Ok, html);
});
