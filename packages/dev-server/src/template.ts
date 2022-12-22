import { formatRoutePath, RouteMethod, RouteSegment } from "@svarta/core";

export function buildTemplate(route: {
  path: string;
  routeSegments: RouteSegment[];
  method: RouteMethod;
}): string {
  const routePath = formatRoutePath(route.routeSegments);

  return `import svartaRoute from "${route.path.replace(".ts", "")}";
  import url from "node:url";
  import { parse, serialize } from "@tinyhttp/cookie";
  
  /***** svarta dev handler *****/
  export default defineEventHandler(async (event) => {
    const req = event.node.req;
    const res = event.node.res;
  
    /***** dev logger *****/
    const now = new Date();
    console.error(\`[\${now.toISOString()}] \${req.method} \${req.url}\`);
  
    try {
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
    
      /***** body validation *****/
      if (svartaRoute.input) {
        // Validate via Zod
        const validation = svartaRoute.input.safeParse(req.body);
        if (!validation.success) {
          res.statusCode = 422;
          res.setHeader("x-powered-by", "svarta");
          return "Unprocessable Entity";
        }
      }
  
      const headers = {
        set: (key, value) => res.setHeader(key.toLowerCase(), value),
        get: (key) => req.headers[key.toLowerCase()],
        entries: () => Object.entries(req.headers),
        keys: () => Object.keys(req.headers),
        values: () => Object.values(req.headers),
      };
  
      const cookieObj = parse(headers.get("cookie") || '');
  
      const setCookies = [];
  
      const cookies = {
        get: (key) => cookieObj[key],
        set: (key, value, opts) => {
          setCookies.push({ key, value, opts });
        },
        entries: () => Object.entries(cookieObj),
        keys: () => Object.keys(cookieObj),
        values: () => Object.values(cookieObj),
      };
    
      const response = await svartaRoute.handler({
        ctx: {},
        params: getRouterParams(event),
        query: url.parse(req.url, true).query,
        headers,
        input: req.body,
        path: req.url.split("?").shift(), // TODO: should probably use new URL?
        url: req.url,
        method: req.method,
        isDev: true,
        cookies,
      });
      
      /***** respond *****/
      for(const [key, value] of Object.entries(response._headers)) {
        res.setHeader(key, value);
      }
  
      /***** set cookies *****/
      res.setHeader(
        "set-cookie", 
        setCookies.map(({ key, value, opts }) => serialize(key, value, opts))
      );
      
      res.setHeader("x-powered-by", "svarta");
      res.statusCode = response._status;
    
      const resBody = response._body;
      if (resBody) {
        if (typeof response._body === "string") {
          return response._body;
        }
        else {
          res.setHeader("content-type", "application/json")
          return JSON.stringify(response._body);
        }
      }
      
      return "";
    }
    catch(error) {
      /***** error handler *****/
      console.error(\`svarta caught an error while handling route (${routePath}): \` + (error?.message || error || "Unknown error"));
      res.statusCode = 500;
      res.setHeader("x-powered-by", "svarta");
      return "Internal Server Error";
    }
  });`;
}
