import { Response, route, Status } from "@svarta/core";
import * as zod from "zod";

export const name = "MiddlewareBeforeBody";

const myRoute = route.middleware(async () => {
  return new Response(Status.Teapot);
});

export default myRoute.input(zod.object({}).strict()).handle(async () => {
  return new Response(Status.Ok);
});
