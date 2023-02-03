import { Response, route, Status } from "../../../../src";

export const name = "GetUser";

export default route.handle(async () => {
  return new Response(Status.Ok);
});
