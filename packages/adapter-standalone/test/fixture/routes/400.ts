import { defineBadRequestErrorHandler, Response, Status } from "@svarta/core";

export default defineBadRequestErrorHandler(() => {
  return new Response(Status.BadRequest, "My custom Bad Request");
});
