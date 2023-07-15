import { defineInvalidInputErrorHandler, Response, Status } from "@svarta/core";

export default defineInvalidInputErrorHandler((error, { path }) => {
  console.error(`Route "${path}" received invalid input`);
  console.error(JSON.stringify(error.issues, null, 2));

  return new Response(Status.UnprocessableEntity, "My custom Unprocessable Entity");
});
