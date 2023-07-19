import { Response, route, Status } from "@svarta/core";

export const name = "GetInfo";

export default route.handle(async ({ query, path, url, isDev, method }) => {
  return new Response(Status.Ok, {
    query,
    path,
    url,
    isDev,
    method,
  });
});
