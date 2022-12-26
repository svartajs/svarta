import { Response, route, Status } from "svarta";
import { deleteNote, getNote } from "../../../../util/notes";

export const name = "DeleteNote";

export const params = ["id"] as const;

export default route.params(params).handle(async ({ params }) => {
  const note = getNote(params.id);
  if (!note) {
    return new Response(Status.Conflict, {
      message: "Note not found",
    });
  }

  deleteNote(note.id);
  return new Response(Status.Ok, {
    message: "Note deleted",
  });
});
