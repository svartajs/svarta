import { parse, serialize } from "@tinyhttp/cookie";
import type { ZodObject } from "zod";

import type Cookies from "./cookies";
import type { SetCookieOptions } from "./cookies";
import type Headers from "./headers";
import type { RouteMethod } from "./method";
import type { HandlerFunction } from "./route";
import Status from "./status";

type HandlerOptions = {
  svartaRoute: {
    handler: HandlerFunction<any, any, any, any>;
    input?: ZodObject<any>;
  };
  body: any;
  headers: Headers;
  setStatus: (x: number) => void;
  params: Record<string, string>;
  query: Record<string, string>;
  url: string;
  method: RouteMethod;
  isDev: boolean;
  formattedRouteName: string;
};

export async function createAndRunHandler(opts: HandlerOptions): Promise<{ body: string }> {
  const {
    body,
    formattedRouteName,
    headers,
    isDev,
    method,
    params,
    query,
    setStatus,
    svartaRoute,
    url,
  } = opts;

  try {
    if (svartaRoute.input) {
      // Validate via Zod
      const validation = svartaRoute.input.safeParse(body);
      if (!validation.success) {
        setStatus(Status.UnprocessableEntity);
        headers.set("x-powered-by", "svarta");
        return {
          body: "Unprocessable Entity",
        };
      }
    }

    const cookieObj = parse(headers.get("cookie") || "");
    const setCookies: { key: string; value: string; opts?: Partial<SetCookieOptions> }[] = [];

    const cookies: Cookies = {
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
      params,
      query,
      headers,
      input: body,
      path: url.split("?").shift()!,
      url,
      method,
      isDev,
      cookies,
    });

    for (const [key, value] of Object.entries(response._headers)) {
      headers.set(key, value);
    }

    headers.set(
      "set-cookie",
      setCookies.map(({ key, value, opts }) => serialize(key, value, opts)),
    );

    headers.set("x-powered-by", "svarta");
    setStatus(response._status);

    const resBody = response._body;
    if (resBody) {
      if (typeof response._body === "string") {
        return {
          body: response._body,
        };
      } else {
        headers.set("content-type", "application/json");
        return {
          body: JSON.stringify(response._body),
        };
      }
    }

    return { body: "" };
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `svarta caught an error while handling route (${formattedRouteName}): ${
          error.message || error || "Unknown error"
        }`,
      );
    } else {
      console.error(
        `svarta caught an error while handling route (${formattedRouteName}): ${
          error || "Unknown error"
        }`,
      );
    }

    setStatus(500);
    headers.set("x-powered-by", "svarta");

    return {
      body: "Internal Server Error",
    };
  }
}
