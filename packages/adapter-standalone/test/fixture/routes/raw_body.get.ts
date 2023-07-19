import { Response, route, Status } from "@svarta/core";

export const name = "RawBody";

export default route.handle(async () => {
  return new Response(Status.Ok, "hello world");
});
