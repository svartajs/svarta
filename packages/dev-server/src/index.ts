import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

import { collectRouteFiles } from "@svarta/core";
import { build, createDevServer, prepare } from "nitropack";

import createNitro from "./nitro";

export async function startSvartaDevServer(routesFolder: string) {
  console.error(`Starting dev server for ${routesFolder}`);

  const routes = await collectRouteFiles(routesFolder);
  console.log(routes.map((route) => route.path).join("\n"));

  if (existsSync(".svarta/dev")) {
    rmSync(".svarta/dev", { recursive: true });
  }
  mkdirSync(".svarta/dev/nitro/routes", { recursive: true });

  for (const route of routes) {
    const tmpFile = resolve(
      `.svarta/dev/nitro/routes${route.routeSegments.reduce((path, seg) => {
        if (seg.type === "sep") {
          return path + "/";
        }
        if (seg.type === "static") {
          return path + seg.value;
        }
        if (seg.type === "param") {
          return path + `[${seg.name}]`;
        }
        return path;
      }, "")}`,
      `index.${route.method.toLowerCase()}.ts`,
    );
    mkdirSync(dirname(tmpFile), { recursive: true });

    writeFileSync(
      tmpFile,
      `import svartaRoute from "${route.path.replace(".ts", "")}";
import url from "node:url";

/***** svarta dev handler *****/
export default defineEventHandler(async (event) => {
  const req = event.node.req;
  const res = event.node.res;

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
  
    const response = await svartaRoute.handler({
      ctx: {},
      params: getRouterParams(event),
      query: url.parse(req.url, true).query,
      headers: {
        set: (key, value) => res.setHeader(key.toLowerCase(), value),
        get: (key) => req.headers[key.toLowerCase()],
        entries: Object.entries(req.headers),
        keys: Object.keys(req.headers),
        values: Object.values(req.headers),
      },
      input: req.body,
      fullPath: req.originalUrl,
      method: req.method,
      isDev: true,
    });
    
    /***** respond *****/
    for(const [key, value] of Object.entries(response._headers)) {
      res.setHeader(key, value);
    }
    
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
    console.error(\`svarta caught an error while handling route (\${req.originalUrl}): \` + (error?.message || error || "Unknown error"));
    res.statusCode = 500;
    return "Internal Server Error";
  }
});
    `,
      "utf-8",
    );
  }

  const nitro = await createNitro(true);

  const devServer = createDevServer(nitro);

  await devServer.listen(3000);
  await prepare(nitro);
  await build(nitro);
}

startSvartaDevServer("demo/routes");
