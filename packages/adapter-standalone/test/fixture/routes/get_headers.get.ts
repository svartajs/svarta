import { Response, route, Status } from "@svarta/core";

export const name = "ReflectHeaders";

export default route.handle(async ({ headers }) => {
  return new Response(Status.Ok, {
    headers: headers.entries(),
  });
});
