import type { RouteMethod } from "@svarta/core";
import type { RouteSegment } from "@svarta/core/dist/types";

function mapRoute(
  route: {
    path: string;
    routeSegments: RouteSegment[];
    method: RouteMethod;
  },
  index: number,
): string {
  const importName = `r${index}`;
  const routePath = route.routeSegments.reduce((buf, seg) => {
    if (seg.type === "sep") {
      return buf + "/";
    }
    if (seg.type === "static") {
      return buf + seg.value;
    }
    if (seg.type === "param") {
      return buf + `:${seg.name}`;
    }
    throw new Error("Route Not supported");
  }, "");
  return `app.${route.method.toLowerCase()}("${routePath}",
  /***** body parsers *****/
  json(),
  /***** svarta handler *****/
  async (req,res)=>{
    try {
      const inputSchema = ${importName}.input;
      if (inputSchema) {
        // Validate via Zod
        const validation = inputSchema.safeParse(req.body);
        if (!validation.success) {
          res.status(422);
          res.set("x-powered-by", "svarta");
          res.send("Unprocessable Entity");
          return;
        }
      }

      const headers = {
        get: (key) => req.get(key),
        set: (key, value) => res.set(key, value),
        // TODO: entries
      };

      const response = await ${importName}.handler({
        query: req.query,
        params: req.params,
        input: req.body,
        headers,
        fullPath: req.path,
        method: req.method,
      });

      res.set("x-powered-by", "svarta");
      res.status(response._status);
      if (response._body) {
        res.send(response._body);
      }
      else {
        res.end();
      }
    }
    catch(error) {
      console.error("svarta caught an error while handling route (${routePath}): " + (error?.message || error || "Unknown error"));
      res.status(500);
      res.send("Internal Server Error");
    }
  }
)`;
}

export function buildTemplate(
  routes: { path: string; routeSegments: RouteSegment[]; method: RouteMethod }[],
) {
  return `import { App } from "@tinyhttp/app";
import { json } from "milliparsec";
/***** routes *****/
${routes.map(({ path }, index) => `import r${index} from "${path}";`).join("\n")}

const app = new App();
${routes.map(mapRoute).join(";\n")};
const port = +(process.env.PORT||"3000");
app.listen(port, () => {
  console.error("svarta app running on http://localhost:"+port);
});`;
}
