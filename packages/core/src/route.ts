import * as zod from "zod";

import RouteInput from "./context";
import Response from "./response";

type HandlerFunction<Schema, Context> = (
  routeInput: RouteInput<Schema, Context>,
) => Promise<Response>;

function buildHandler<Schema, Context>(
  fn: HandlerFunction<Schema, Context>,
  middlewares: Function[],
) {
  return async (routeInput: RouteInput<Schema, Context>) => {
    let transformedContext = routeInput.ctx;
    for (const mw of middlewares) {
      let mwInput = { ...routeInput, ctx: { ...transformedContext } };
      const result = await mw(mwInput);

      if (result.__svartaResponse) {
        return result;
      } else {
        transformedContext = result;
      }
    }
    return fn({ ...routeInput, ctx: transformedContext });
  };
}

class RouteBuilder<Context = {}> {
  private _middlewares: Function[] = [];

  middleware<NewContext>(
    fn: (routeInput: RouteInput<null, Context>) => Promise<Response | NewContext>,
  ): RouteBuilder<NewContext> {
    const newRouteBuilder = new RouteBuilder<NewContext>();
    newRouteBuilder._middlewares.push(...this._middlewares, fn);
    return newRouteBuilder;
  }

  input<Schema>(schema: zod.Schema<Schema>): ValidatedRouteBuilder<Schema, Context> {
    const newRouteBuilder = new ValidatedRouteBuilder<Schema, Context>(schema);
    newRouteBuilder._middlewares.push(...this._middlewares);
    return newRouteBuilder;
  }

  handle(fn: HandlerFunction<null, Context>) {
    return {
      handler: buildHandler(fn, this._middlewares),
      input: null,
    };
  }
}

class ValidatedRouteBuilder<Schema, Context = {}> {
  _middlewares: Function[] = [];
  private _inputSchema: zod.Schema<Schema>;

  constructor(schema: zod.Schema<Schema>) {
    this._inputSchema = schema;
  }

  handle(fn: HandlerFunction<Schema, Context>) {
    return {
      handler: buildHandler(fn, this._middlewares),
      input: this._inputSchema,
    };
  }
}

export const defaultRoute = new RouteBuilder();
