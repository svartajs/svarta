import { defineNotFoundErrorHandler, Response, Status } from "@svarta/core";

export default defineNotFoundErrorHandler(({ path }) => {
  console.error(`Route "${path}" not found`);
  return new Response(Status.NotFound, "My custom Not Found");
});
