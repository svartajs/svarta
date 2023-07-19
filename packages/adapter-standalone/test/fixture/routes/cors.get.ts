import { Response, route, Status } from "@svarta/core";
import { cors } from "../cors";

export const name = "Cors";

export default route
  .middleware(() => {
    return {
      message: "Hello",
    };
  })
  .middleware(cors())
  .handle(async ({ ctx }) => {
    return new Response(Status.Ok, ctx);
  });
