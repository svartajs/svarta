import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { checkRoute, collectRouteFiles } from "@svarta/core";
import chokidar from "chokidar";
import esbuild from "esbuild";
import debounce from "lodash.debounce";
import { build, createDevServer, prepare } from "nitropack";

import createNitro from "./nitro";

async function nitrofyRoutes(routesFolder: string): Promise<void> {
  const routes = await collectRouteFiles(routesFolder);
  console.log(`[@svarta/dev-server] Loading ${routes.length} routes`);

  for (const route of routes) {
    const jsFile = resolve(`.svarta/tmp/route-${randomBytes(4).toString("hex")}.mjs`);

    await esbuild.build({
      bundle: true,
      banner: {
        js: "/***** svarta route *****/",
      },
      entryPoints: [route.path],
      outfile: jsFile,
      platform: "node",
      format: "esm",
      target: "es2019",
    });

    try {
      await checkRoute(jsFile, route.routeSegments);
      unlinkSync(jsFile);
    } catch (error) {
      const { message } = error as Error;
      console.log(message);
      unlinkSync(jsFile);
    }

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
      entries: Object.entries(req.headers),
      keys: Object.keys(req.headers),
      values: Object.values(req.headers),
    };

    const cookies = {}; // TODO:
  
    const response = await svartaRoute.handler({
      ctx: {},
      params: getRouterParams(event),
      query: url.parse(req.url, true).query,
      headers,
      input: req.body,
      fullPath: req.url,
      method: req.method,
      isDev: true,
      cookies,
      // TODO: basePath
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
    res.setHeader("x-powered-by", "svarta");
    return "Internal Server Error";
  }
});
    `,
      "utf-8",
    );
  }
}

export async function startSvartaDevServer(routesFolder: string) {
  process.env["NODE_ENV"] = "development";

  console.log(`[@svarta/dev-server] Starting dev server for ${routesFolder}`);

  if (existsSync(".svarta/dev")) {
    rmSync(".svarta/dev", { recursive: true });
  }
  mkdirSync(".svarta/dev/nitro/routes", { recursive: true });

  await nitrofyRoutes(routesFolder);

  const nitro = await createNitro(true);
  const devServer = createDevServer(nitro);
  await devServer.listen(+(process.env["PORT"] || 3000));
  await prepare(nitro);
  await build(nitro);

  const reloadRoutes = debounce(async () => {
    if (existsSync(".svarta/dev")) {
      rmSync(".svarta/dev", { recursive: true });
    }
    mkdirSync(".svarta/dev/nitro/routes", { recursive: true });

    await nitrofyRoutes(routesFolder);
    await build(nitro);
  }, 1000);

  chokidar
    .watch(routesFolder, {
      persistent: false,
    })
    //.on("change", reloadRoutes)
    .on("add", reloadRoutes)
    .on("unlink", reloadRoutes)
    .on("unlinkDir", reloadRoutes);
}
