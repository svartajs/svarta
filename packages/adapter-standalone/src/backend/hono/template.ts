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
import { createServer as createServerHTTP } from "node:http";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export const getRequestListener = (fetchCallback) => {
  return async (incoming, outgoing) => {
    const method = incoming.method || 'GET'
    const url = \`http://\${incoming.headers.host}\${incoming.url}\`

    const headerRecord = []
    const len = incoming.rawHeaders.length
    for (let i = 0; i < len; i += 2) {
      headerRecord.push([incoming.rawHeaders[i], incoming.rawHeaders[i + 1]])
    }

    const init = {
      method: method,
      headers: headerRecord,
    }

    if (!(method === 'GET' || method === 'HEAD')) {
      // lazy-consume request body
      init.body = Readable.toWeb(incoming);
      // node 18 fetch needs half duplex mode when request body is stream
      ;init.duplex = 'half'
    }

    let res

    try {
      res = (await fetchCallback(new Request(url.toString(), init)))
    } catch (e) {
      res = new Response(null, { status: 500 })
      if (e instanceof Error) {
        // timeout error emits 504 timeout
        if (e.name === 'TimeoutError' || e.constructor.name === 'TimeoutError') {
          res = new Response(null, { status: 504 })
        }
      }
    }

    const contentType = res.headers.get('content-type') || ''
    // nginx buffering variant
    const buffering = res.headers.get('x-accel-buffering') || ''
    const contentEncoding = res.headers.get('content-encoding')
    const contentLength = res.headers.get('content-length')
    const transferEncoding = res.headers.get('transfer-encoding')

    for (const [k, v] of res.headers) {
      if (k === 'set-cookie') {
        // node native Headers.prototype has getSetCookie method
        outgoing.setHeader(k, res.headers.getSetCookie(k))
      } else {
        outgoing.setHeader(k, v)
      }
    }
    outgoing.statusCode = res.status

    if (res.body) {
      try {
        /**
         * If content-encoding is set, we assume that the response should be not decoded.
         * Else if transfer-encoding is set, we assume that the response should be streamed.
         * Else if content-length is set, we assume that the response content has been taken care of.
         * Else if x-accel-buffering is set to no, we assume that the response should be streamed.
         * Else if content-type is not application/json nor text/* but can be text/event-stream,
         * we assume that the response should be streamed.
         */
        if (
          contentEncoding ||
          transferEncoding ||
          contentLength ||
          /^no$/i.test(buffering) ||
          !/^(application\\/json\\b|text\\/(?!event-stream\\b))/i.test(contentType)
        ) {
          await pipeline(Readable.fromWeb(res.body), outgoing)
        } else {
          const text = await res.text()
          outgoing.setHeader('Content-Length', Buffer.byteLength(text))
          outgoing.end(text)
        }
      } catch (e) {
        // try to catch any error, to avoid crash
        console.error(e)
        const err = e instanceof Error ? e : new Error('unknown error', { cause: e })
        // destroy error must accept an instance of Error
        outgoing.destroy(err)
      }
    } else {
      outgoing.end()
    }
  }
}

const createAdaptorServer = (options) => {
  const fetchCallback = options.fetch
  const requestListener = getRequestListener(fetchCallback)
  const createServer = options.createServer || createServerHTTP
  const server = createServer(options.serverOptions || {}, requestListener)
  return server
}

const serve = (options, listeningListener) => {
  const server = createAdaptorServer(options);
  server.listen(options?.port ?? 3000, options.hostname ?? '0.0.0.0', () => {
    const serverInfo = server.address();
    listeningListener && listeningListener(serverInfo);
  })
  return server
}

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
