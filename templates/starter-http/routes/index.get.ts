import { readFileSync } from "node:fs";

import { Response, Status } from "svarta";

import route from "../route";

const html = readFileSync("index.html", "utf-8");

export const name = "LandingPage";

export default route.handle(async () => {
  return new Response(Status.Ok, html);
});
