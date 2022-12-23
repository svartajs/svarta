import { Response, route, Status } from "@svarta/core";

export const name = "ReflectBody";

export default route.handle(async ({ input, method }) => {
  return new Response(Status.Ok, {
    input,
    method,
  });
});
