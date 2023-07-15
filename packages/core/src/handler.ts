import { parse, serialize } from "@tinyhttp/cookie";
import type { ZodAny, ZodObject } from "zod";

import type Cookies from "./cookies";
import type { SetCookieOptions } from "./cookies";
import HandlerEvent from "./handler_event";
import type Headers from "./headers";
import type { RouteMethod } from "./method";
import Response from "./response";
import type {
  BadRequestErrorHandlerFn,
  HandlerFn,
  /*  InternalServerErrorHandlerFn, */
  InvalidInputErrorHandlerFn,
  /* UnknownErrorHandlerFn, */
} from "./route";

type HandlerOptions = {
  svartaRoute: {
    handler: HandlerFn<any, any, any, any>;
    runMiddlewares: (routeInput: Omit<HandlerEvent<any, any, any>, "input">) => any;
    input?: ZodObject<any>;
    output?: ZodAny;
  };
  parseBody: () => any;
  headers: Headers;
  setStatus: (x: number) => void;
  params: Record<string, string>;
  query: Record<string, string>;
  url: string;
  method: RouteMethod;
  isDev: boolean;
  formattedRouteName: string;
  errorHandler: {
    badRequest: BadRequestErrorHandlerFn;
    invalidInput: InvalidInputErrorHandlerFn;
    // TODO: 500
  };
};

export async function createAndRunHandler(opts: HandlerOptions): Promise<{ body: string }> {
  const {
    parseBody,
    formattedRouteName,
    headers,
    isDev,
    method,
    params,
    query,
    setStatus,
    svartaRoute,
    url,
    errorHandler,
  } = opts;

  try {
    const cookieObj = parse(headers.get("cookie") || "");
    const setCookies: { key: string; value: string; opts?: Partial<SetCookieOptions> }[] = [];

    /* TODO: remove tinyhttp cookie and use hono's cookie functions (c.cookie, c.req.cookie) instead */
    const cookies: Cookies = {
      get: (key) => cookieObj[key],
      set: (key, value, opts) => {
        setCookies.push({ key, value, opts });
      },
      entries: () => Object.entries(cookieObj),
      keys: () => Object.keys(cookieObj),
      values: () => Object.values(cookieObj),
    };

    const path = url.split("?").at(0)!;

    const baseInput = {
      ctx: {},
      params,
      query,
      headers,
      path,
      url,
      method,
      isDev,
      cookies,
    };

    const mwResponse = await svartaRoute.runMiddlewares(baseInput);

    function applyResponse(response: Response<any>) {
      for (const [key, value] of Object.entries(response._headers)) {
        headers.set(key, value);
      }

      if (setCookies.length) {
        headers.set(
          "set-cookie",
          setCookies.map(({ key, value, opts }) => serialize(key, value, opts)).join("; "),
        );
      }

      setStatus(response._status);

      const resBody = response._body;
      if (resBody) {
        if (typeof response._body === "string") {
          return {
            body: response._body,
          };
        } else {
          headers.set("content-type", "application/json; charset=utf-8");
          return {
            body: JSON.stringify(response._body),
          };
        }
      }

      return {
        body: "",
      };
    }

    let response;

    if (mwResponse instanceof Response) {
      return applyResponse(mwResponse);
    }

    let body = null;

    if (svartaRoute.input && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      try {
        body = await parseBody();
      } catch (error) {
        const response = await errorHandler.badRequest(error, baseInput);
        return applyResponse(response);
      }

      // Validate via Zod
      const validation = svartaRoute.input.safeParse(body);
      if (!validation.success) {
        const response = await errorHandler.invalidInput(validation.error, baseInput);
        return applyResponse(response);
      }
    }

    response = await svartaRoute.handler({
      ...baseInput,
      ctx: mwResponse,
      input: body,
    });

    if (response._body && svartaRoute.output) {
      const validation = svartaRoute.output.safeParse(response._body);
      if (!validation.success) {
        console.error(
          `svarta caught an invalid route output type, not matching the given output validator.
  That means your route "${path}" is probably buggy: ${JSON.stringify(validation.error, null, 2)}`,
        );
        setStatus(500);
        return { body: "Internal Server Error" };
      }
    }

    return applyResponse(response);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : error;

    console.error(
      `svarta caught an error while handling route (${formattedRouteName}): ${
        errMsg || "Unknown error"
      }`,
    );
    console.error(
      "This is probably a bug, please report: https://github.com/svartajs/svarta/issues",
    );

    setStatus(500);
    return { body: "Internal Server Error" };
  }
}
