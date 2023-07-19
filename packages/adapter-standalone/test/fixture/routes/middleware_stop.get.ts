import { Response, route, Status } from "@svarta/core";

export const name = "Middleware";

const myRoute = route.middleware(async () => {
  return new Response(Status.Teapot);
});

export default myRoute.handle(async () => {
  return new Response(Status.Ok);
});
