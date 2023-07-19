import { sep as posixSeparator } from "node:path/posix";
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
  __svartaHonoHandler({
    ...${importName},
    routePath: "${routePath}"
  }),
)`;
}

export function buildTemplate(
  routes: CollectedRoute[],
  errorHandlers: {
    "400": string;
    "404": string;
    "422": string;
  },
  defaultPort: number,
  logger = true,
) {
  /* TODO: https://github.com/honojs/node-server/pull/7 */
  return `/***** imports *****/
import { createAndRunHandler } from "@svarta/core";
import { Hono } from "hono";
import { serve } from "@hono/node-server";

/***** routes *****/
${routes
  .map(
    ({ path }, index) =>
      `import r${index} from "${path.replaceAll(windowsSeparator, posixSeparator)}";`,
  )
  .join("\n")}

/**** error handlers *****/
import __svarta_error_400 from "${errorHandlers["400"]}";
import __svarta_error_404 from "${errorHandlers["404"]}";
import __svarta_error_422 from "${errorHandlers["422"]}";

function __honoToSvarta(c) {
  async function parseBody() {
    return c.req.json();
  }
  
  const headers = {
    get: (key) => c.req.header(key),
    set: (key, value) => c.header(key, value),
    entries: () => Array.from(c.req.headers.entries()),
    keys: () => Array.from(c.req.headers.keys()),
    values: () => Array.from(c.req.headers.values()),
  };

  const url = new URL(c.req.raw.url);

  return {
    parseBody,
    headers,
    setStatus: (status) => {
      c.status(status);
    },
    params: c.req.param(),
    query: c.req.query(),
    url: url.pathname + url.search,
    method: c.req.method,
  }
}

/***** handler *****/
function __svartaHonoHandler({ routePath, ...svartaRoute }) {
  return async c => {
    const baseInput = __honoToSvarta(c);

    const { body } = await createAndRunHandler({
      ...baseInput,
      svartaRoute,
      isDev: false,
      formattedRouteName: routePath,
      errorHandler: {
        badRequest: __svarta_error_400,
        invalidInput: __svarta_error_422,
      }
    });

    return c.body(body ?? "");
  }
}

const app = new Hono();

${
  logger
    ? `/***** logger *****/
app.use(async (c, next) => {
  const now = new Date();
  console.error(\`[\${now.toISOString()}] \${c.req.method} \${new URL(c.req.raw.url).pathname}\`);
  await next();
});`
    : ""
}

${routes.map(mapRoute).join(";\n")};

/***** svarta 404 handler *****/
app.use(
  "*", 
  __svartaHonoHandler({
    routePath: "",
    handler: __svarta_error_404,
    runMiddlewares: async () => ({}),
  })
);

/***** startup *****/
const port = +(process.env.SVARTA_PORT || process.env.PORT || "${defaultPort}");
console.error("Starting server on port " + port);

serve({
  fetch: app.fetch,
  port,
}, ({ port }) => {
  console.error("Server running on http://localhost:" + port);
});
`;
}
