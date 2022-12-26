import { Response, route, Status } from "svarta";

export default route.handle(async ({ isDev }) => {
  if (isDev) {
    return new Response(Status.Ok, {
      text: "Edit <kbd>routes/api/hello.get.ts</kbd> and press F5 to see changes!",
    });
  }
  return new Response(Status.Ok, {
    text: "This is a built app!",
  });
});
