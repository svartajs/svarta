import { Response, route, Status } from "@svarta/core";

export const name = "Cookies";

export default route.handle(async ({ cookies }) => {
  cookies.set("cookie-1", "abc");
  cookies.set("cookie-2", "xyz");

  return new Response(Status.Ok, {
    cookies: cookies.entries(),
  });
});
