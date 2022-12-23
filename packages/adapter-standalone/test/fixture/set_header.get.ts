import { Response, route, Status } from "@svarta/core";

export const name = "SetHeader";

export default route.handle(async ({ headers }) => {
  headers.set("x-custom-header", "123");
  return new Response(Status.Ok);
});
