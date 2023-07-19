import { Response, route, Status } from "@svarta/core";

export const name = "DeleteRoute";

export default route.handle(async ({ method }) => {
  return new Response(Status.Ok, {
    method,
  });
});
