import * as zod from "zod";

import { CollectedRoute } from "./collect_routes";
import { formatRoutePath } from "./fs_router";

export type LoadedRoute = CollectedRoute & {
  name: string | null;
  params: readonly string[] | null;
  handler: () => void;
};

type LoadRouteErrorCode =
  | "duplicate_route_name"
  | "missing_route_handler"
  | "invalid_params"
  | "unused_params"
  | "non_exhausted_params";

type LoadRouteWarningCode = "missing_name";

export async function loadRoute({ path, method, routeSegments }: CollectedRoute): Promise<{
  route: LoadedRoute;
  errors: { message: string; code: LoadRouteErrorCode; suggestion: string | null }[];
  warnings: { message: string; code: LoadRouteWarningCode; suggestion: string | null }[];
}> {
  const errors: { message: string; code: LoadRouteErrorCode; suggestion: string | null }[] = [];
  const warnings: { message: string; code: LoadRouteWarningCode; suggestion: string | null }[] = [];

  const routePath = formatRoutePath(routeSegments);
  const route = await import(path);

  const { default: def, params, name } = route;
  const handler = def?.handler;

  if (!name) {
    warnings.push({
      code: "missing_name",
      message: `Route "${routePath}" has no custom name`,
      suggestion: `To your route file, add:\n\nexport const name = "MyRouteName";`,
    });
  }

  if (!handler) {
    errors.push({
      message: `Route "${routePath}" is not exporting a route handler`,
      suggestion: null,
      code: "missing_route_handler",
    });
  }

  if (params) {
    if (!zod.array(zod.string()).safeParse(params).success) {
      errors.push({
        message: `Route "${routePath}": invalid params export`,
        suggestion: null,
        code: "invalid_params",
      });
    }
  }

  const definedParams = params || [];
  const realParams = routeSegments.reduce((params, seg) => {
    if (seg.type === "param" || seg.type === "catchAll") {
      params.push(seg.name);
    }
    return params;
  }, [] as string[]);

  const nonExhaustedParams = realParams.filter((param: string) => !definedParams.includes(param));
  const unusedParams = definedParams.filter((param: string) => !realParams.includes(param));

  if (unusedParams.length) {
    const routePath = formatRoutePath(routeSegments);
    errors.push({
      message: `Param defined but not present in route "${routePath}": ${nonExhaustedParams.join(
        ", ",
      )}`,
      suggestion: `Remove "${unusedParams[0]}" from the "params" array`,
      code: "unused_params",
    });
  }

  if (nonExhaustedParams.length) {
    const routePath = formatRoutePath(routeSegments);
    errors.push({
      message: `Param(s) not defined in route "${routePath}": ${nonExhaustedParams.join(", ")}`,
      suggestion: `To your route file, add:\n\nexport const params = [${realParams
        .map((x) => `"${x}"`)
        .join(", ")}] as const;`,
      code: "non_exhausted_params",
    });
  }

  return {
    route: { method, name, params, handler, path, routeSegments },
    errors,
    warnings,
  };
}

export async function loadRoutes(collectedRoutes: CollectedRoute[]): Promise<{
  routes: LoadedRoute[];
  errors: { message: string; code: LoadRouteErrorCode; suggestion: string | null }[];
  warnings: { message: string; code: LoadRouteWarningCode; suggestion: string | null }[];
}> {
  const routes: LoadedRoute[] = [];
  const errors: {
    message: string;
    code: LoadRouteErrorCode;
    suggestion: string | null;
  }[] = [];
  const warnings: { message: string; code: LoadRouteWarningCode; suggestion: string | null }[] = [];

  for (const collectedRoute of collectedRoutes) {
    const { errors: routeErrors, warnings: routeWarnings, route } = await loadRoute(collectedRoute);
    errors.push(...routeErrors);
    warnings.push(...routeWarnings);
    routes.push(route);
  }

  const countedNames: Map<string, number> = new Map();
  routes
    .filter(({ name }) => name)
    .map(({ name }) => name!)
    .forEach((name) => {
      const entry = countedNames.get(name);
      if (entry) {
        countedNames.set(name, entry + 1);
      } else {
        countedNames.set(name, 1);
      }
    });

  for (const [key, count] of countedNames.entries()) {
    if (count > 1) {
      errors.push({
        code: "duplicate_route_name",
        message: `Duplicate route name: "${key}"`,
        suggestion: null,
      });
    }
  }

  return {
    routes,
    errors,
    warnings,
  };
}
