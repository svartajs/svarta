import { Response, route, Status } from "@svarta/core";

export const name = "ParameterRoute";

export const params = ["id"] as const;

export default route.params(params).handle(async ({ params, path }) => {
  return new Response(Status.Ok, {
    params,
    path,
  });
});
