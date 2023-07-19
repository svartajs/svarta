import { Response, route, Status } from "@svarta/core";
import * as zod from "zod";

export const name = "InvalidOutput";

const outputSchema = zod.object({ message: zod.string() }).strict();

export default route.output(outputSchema).handle(() => {
  return new Response(Status.Ok, {
    message: "hello",
    // NOTE: TypeScript doesn't show an error because of https://github.com/colinhacks/zod/issues/2489
    // However, the output will be validated correctly, preventing the output from containing the
    // unwanted prop
    userPasswordOops: "testtesttest",
  });
});
