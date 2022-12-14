import type { RouteMethod, RouteSegment } from "@svarta/core";
import { formatRoutePath } from "@svarta/core";

function mapRoute(
  route: {
    path: string;
    routeSegments: RouteSegment[];
    method: RouteMethod;
  },
  index: number,
): string {
  const importName = `r${index}`;
  const routePath = formatRoutePath(route.routeSegments);
  return `app.${route.method.toLowerCase()}("${routePath}",
  /***** body parser *****/
  async (req,res,next)=>{
    await json()(req, res, (err) => {
      if (err) {
        res.status(400);
        res.send("Bad request");
      }
      else {
        next();
      }
    });
  },
  /***** svarta handler *****/
  __svartaTinyHttpHandler({ 
    handler: ${importName}.handler,
    input: ${importName}.input,
    routePath: "${routePath}"
  }),
)`;
}

export function buildTemplate(
  routes: { path: string; routeSegments: RouteSegment[]; method: RouteMethod }[],
) {
  return `/***** imports *****/
import { App } from "@tinyhttp/app";
import { json } from "milliparsec";
/***** routes *****/
${routes.map(({ path }, index) => `import r${index} from "${path}";`).join("\n")}

function __svartaTinyHttpHandler({ input, handler, routePath }) {
  return async (req, res) => {
    try {
      /***** body validation *****/
      if (input) {
        // Validate via Zod
        const validation = input.safeParse(req.body);
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
        entries: Object.entries(req.headers),
        keys: Object.keys(req.headers),
        values: Object.values(req.headers),
      };

      /***** call handler *****/
      const response = await handler({
        ctx: {} /* context starts empty */,
        query: req.query,
        params: req.params,
        input: req.body,
        headers,
        fullPath: req.path, // TODO: this should include query, also add basePath
        method: req.method,
        isDev: false,
      });

      /***** respond *****/
      for(const [key, value] of Object.entries(response._headers)) {
        res.set(key, value);
      }

      res.set("x-powered-by", "svarta");
      res.status(response._status);

      const resBody = response._body;
      if (resBody) {
        if (typeof resBody === "string") {
          res.send(resBody);
        }
        else {
          res.json(resBody);
        }
      }
      else {
        res.end();
      }
    }
    catch(error) {
      /***** error handler *****/
      console.error(\`svarta caught an error while handling route (\${routePath}): \` + (error?.message || error || "Unknown error"));
      res.status(500);
      res.send("Internal Server Error");
    }
  }
}

const app = new App();

/***** logger and header *****/
app.use((req, res, next) => {
  const now = new Date();
  console.error(\`[\${now.toISOString()}] \${req.method} \${req.path}\`);
  res.set("x-powered-by", "svarta");
  next();
});

${routes.map(mapRoute).join(";\n")};

/***** startup *****/
const port = +(process.env.SVARTA_PORT || process.env.PORT || "3000");
console.error("Starting server on port " + port);
app.listen(port, () => {
  console.error("Server running on http://localhost:" + port);
});`;
}
