import { sep as posixSeperator } from "node:path/posix";
import { sep as windowsSeparator } from "node:path/win32";

import { formatRoutePath, RouteMethod, RouteSegment } from "@svarta/core";

export function buildTemplate(route: {
  path: string;
  routeSegments: RouteSegment[];
  method: RouteMethod;
}): string {
  const routePath = formatRoutePath(route.routeSegments);

  return `import svartaRoute from "${route.path
    .replaceAll(windowsSeparator, posixSeperator)
    .replace(/\.tsx?$/, "")}";
  import { createAndRunHandler } from "@svarta/core";
  import url from "node:url";

  /***** svarta dev handler *****/
  export default defineEventHandler(async (event) => {
    const req = event.node.req;
    const res = event.node.res;
  
    /***** dev logger *****/
    const now = new Date();
    console.error(\`[\${now.toISOString()}] \${req.method} \${req.url}\`);

    // https://github.com/tinyhttp/milliparsec/blob/master/src/index.ts
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }
      try {
        req.body = JSON.parse(body);
      }
      catch {};
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
      body: req.body,
      headers,
      setStatus: (status) => {
        res.statusCode = status;
      },
      params: getRouterParams(event),
      query: url.parse(req.url, true).query,
      url: req.url,
      method: req.method,
      isDev: true,
      formattedRouteName: "${routePath}"
    });
    return body;
  });`;
}
