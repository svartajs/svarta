import { defineNotFoundErrorHandler, Response, Status } from "svarta";

export default defineNotFoundErrorHandler(() => {
  return new Response(Status.NotFound, "Not Found");
});
