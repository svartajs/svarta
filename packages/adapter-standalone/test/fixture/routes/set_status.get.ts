import { Response, route, Status } from "@svarta/core";

export const name = "SetStatus";

export default route.handle(async () => {
  return new Response(Status.Teapot);
});
