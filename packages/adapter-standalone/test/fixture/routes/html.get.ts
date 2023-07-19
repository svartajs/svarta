import { Response, route, Status } from "@svarta/core";

export const name = "RenderHtml";

const myWebPage = `<html>
  <body>
    Hello
  </body>
</html>`;

export default route.handle(async ({ headers }) => {
  headers.set("content-type", "text/html");
  return new Response(Status.Ok, myWebPage);
});
