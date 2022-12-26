import { sep as posixSeperator } from "node:path/posix";
import { sep as windowsSeparator } from "node:path/win32";

import type { CollectedRoute, RouteMethod, RouteSegment } from "@svarta/core";
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
  /***** svarta handler *****/
  __svartaTinyHttpHandler({ 
    handler: ${importName}.handler,
    input: ${importName}.input,
    routePath: "${routePath}"
  }),
)`;
}

export function buildTemplate(routes: CollectedRoute[], defaultPort: number, logger = true) {
  return `/***** imports *****/
import { App } from "@tinyhttp/app";
import { createAndRunHandler } from "@svarta/core";

/***** routes *****/
${routes
  .map(
    ({ path }, index) =>
      `import r${index} from "${path.replaceAll(windowsSeparator, posixSeperator)}";`,
  )
  .join("\n")}

/***** handler *****/
function __svartaTinyHttpHandler({ input, handler, routePath }) {
  return async (req, res) => {
    /***** body parser *****/
    // https://github.com/tinyhttp/milliparsec/blob/master/src/index.ts
    if (input && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }
      try {
        req.body = JSON.parse(body);
      }
      catch {
        res.status(400);
        res.send("Bad Request");
        return;
      };
    }

    const headers = {
      get: (key) => req.get(key),
      set: (key, value) => res.set(key, value),
      entries: () => Object.entries(req.headers),
      keys: () => Object.keys(req.headers),
      values: () => Object.values(req.headers),
    };

    const { body } = await createAndRunHandler({
      svartaRoute: { input, handler },
      body: req.body,
      headers,
      setStatus: (status) => {
        res.status(status);
      },
      params: req.params,
      query: req.query,
      url: req.originalUrl,
      method: req.method,
      isDev: false,
      formattedRouteName: routePath,
    });
    if (body) {
      res.send(body);
    }
    else {
      res.end();
    }
  }
}

const app = new App();

/***** header *****/
app.use((_, res, next) => {
  res.set("x-powered-by", "svarta");
  next();
});

${
  logger
    ? `/***** logger *****/
app.use((req, _, next) => {
  const now = new Date();
  console.error(\`[\${now.toISOString()}] \${req.method} \${req.path}\`);
  next();
});`
    : ""
}

${routes.map(mapRoute).join(";\n")};

/***** startup *****/
const port = +(process.env.SVARTA_PORT || process.env.PORT || "${defaultPort}");
console.error("Starting server on port " + port);
app.listen(port, () => {
  console.error("Server running on http://localhost:" + port);
});`;
}
