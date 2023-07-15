/**
 * This is the error handler that triggers when a request contains a
 * syntactically correct, but semantically incorrect body
 */

import { defineInvalidInputErrorHandler, Response, Status } from "svarta";

export default defineInvalidInputErrorHandler((error, { path }) => {
  console.error(`Route "${path}" received invalid input`);
  console.error(JSON.stringify(error.issues, null, 2));

  return new Response(Status.UnprocessableEntity, "Unprocessable Entity");
});
