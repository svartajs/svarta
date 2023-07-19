import { Response, route, Status } from "@svarta/core";

export const name = "MiddlewareStop";

const myRoute = route.middleware(async () => {
  return {
    user: "peter",
  };
});

export default myRoute.handle(async ({ ctx }) => {
  return new Response(Status.Ok, {
    user: ctx.user,
  });
});
