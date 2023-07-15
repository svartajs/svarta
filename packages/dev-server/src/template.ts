import { sep as posixSeparator } from "node:path/posix";
import { sep as windowsSeparator } from "node:path/win32";

import { formatRoutePath, RouteMethod, RouteSegment } from "@svarta/core";

export function buildTemplate(
  route: {
    path: string;
    routeSegments: RouteSegment[];
    method: RouteMethod;
  },
  errorHandlers: {
    "400": string;
    "422": string;
  },
): string {
  const routePath = formatRoutePath(route.routeSegments);

  return `import svartaRoute from "${route.path
    .replaceAll(windowsSeparator, posixSeparator)
    .replace(/\.tsx?$/, "")}";
import { createAndRunHandler } from "@svarta/core";
import url from "node:url";

/**** error handlers *****/
import __svarta_error_400 from "${errorHandlers["400"]}";
import __svarta_error_422 from "${errorHandlers["422"]}";

/***** svarta dev handler *****/
export default defineEventHandler(async (event) => {
  const req = event.node.req;
  const res = event.node.res;

  /***** dev logger *****/
  const now = new Date();
  console.error(\`[\${now.toISOString()}] \${req.method} \${req.url}\`);

  /***** body parser *****/
  async function parseBody() {
    // https://github.com/tinyhttp/milliparsec/blob/master/src/index.ts
    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }
    return JSON.parse(body);
  }

  const headers = {
    set: (key, value) => res.setHeader(key.toLowerCase(), value),
    get: (key) => req.headers[key.toLowerCase()],
    entries: () => Object.entries(req.headers),
    keys: () => Object.keys(req.headers),
    values: () => Object.values(req.headers),
  };

  const { body } = await createAndRunHandler({
    svartaRoute,
    parseBody,
    headers,
    setStatus: (status) => {
      res.statusCode = status;
    },
    params: getRouterParams(event),
    query: url.parse(req.url, true).query,
    url: req.url,
    method: req.method,
    isDev: true,
    formattedRouteName: "${routePath}",
    errorHandler: {
      badRequest: __svarta_error_400,
      invalidInput: __svarta_error_422,
    }
  });
  return body;
});
`;
}
