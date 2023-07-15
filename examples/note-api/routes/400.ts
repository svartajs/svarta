/**
 * This is the error handler that triggers when a request contains a
 * malformed body (malformed JSON)
 */

import { defineBadRequestErrorHandler, Response, Status } from "svarta";

export default defineBadRequestErrorHandler(() => {
  return new Response(Status.BadRequest, "Bad Request");
});
