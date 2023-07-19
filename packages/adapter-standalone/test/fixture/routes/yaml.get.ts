import { Response, route, Status } from "@svarta/core";

export const name = "YamlBody";

export default route.handle(async ({ headers }) => {
  headers.set("content-type", "application/yml; charset=utf-8");
  return new Response(Status.Ok, "message: hello world");
});
