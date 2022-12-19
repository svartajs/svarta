import { Response, route, Status } from "@svarta/core";

export default route.handle(async ({ isDev }) => {
  if (isDev) {
    return new Response(Status.Ok, {
      headline: "Hello world!",
      text: "Edit <kbd>routes/api/hello/get.ts</kbd> and refresh to see changes!",
    });
  }
  return new Response(Status.Ok, {
    headline: "Hello world!",
    text: "This is a built app!",
  });
});
