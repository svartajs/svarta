import { Response, route, Status } from "svarta";

import { listNotes } from "../../../util/notes";

export const name = "ListNotes";

export default route.handle(async () => {
  return new Response(Status.Ok, {
    message: "Notes retrieved",
    result: listNotes(),
  });
});
