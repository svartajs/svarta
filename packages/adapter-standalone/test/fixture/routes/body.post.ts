import { Response, route, Status } from "@svarta/core";
import * as zod from "zod";

export const name = "ReflectBody";

export default route
  .input(zod.object({ message: zod.string() }).strict())
  .handle(async ({ input, method }) => {
    return new Response(Status.Ok, {
      input,
      method,
    });
  });
