import { Response, route, Status } from "../../../../src";

export const name = "Duplicate";

export default route.handle(async () => {
  return new Response(Status.Ok);
});
