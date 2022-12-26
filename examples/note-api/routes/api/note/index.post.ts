import { Response, route, Status } from "svarta";
import * as zod from "zod";

import { createNote } from "../../../util/notes";

export const name = "CreateNote";

export default route
  .input(zod.object({ text: zod.string().min(1) }).strict())
  .handle(async ({ input }) => {
    const note = createNote(input.text);
    return new Response(Status.Ok, {
      message: "Note created",
      result: note,
    });
  });
