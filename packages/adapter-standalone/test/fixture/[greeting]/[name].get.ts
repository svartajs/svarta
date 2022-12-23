import { Response, route, Status } from "@svarta/core";

export const name = "MultiParameterRoute";

export const params = ["greeting", "name"] as const;

export default route.params(params).handle(async ({ params, path }) => {
  return new Response(Status.Ok, {
    params,
    path,
  });
});
