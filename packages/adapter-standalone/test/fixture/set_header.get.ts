import { Response, route, Status } from "@svarta/core";

export const name = "SetHeader";

export default route.handle(async ({ headers }) => {
  headers.set("x-custom-header", "123");
  headers.set("x-powered-by", "asd");
  return new Response(Status.Ok);
});
