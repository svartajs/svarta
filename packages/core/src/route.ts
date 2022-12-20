import * as zod from "zod";

import RouteInput from "./handler_event";
import Response from "./response";

type HandlerFunction<Schema, Context, Output> = (
  routeInput: RouteInput<Schema, Context>,
) => Promise<Response<Output>>;

function buildHandler<Schema, Context, Output>(
  fn: HandlerFunction<Schema, Context, Output>,
  middlewares: Function[],
) {
  return async (routeInput: RouteInput<Schema, Context>) => {
    let transformedContext = routeInput.ctx;
    for (const mw of middlewares) {
      const mwInput = { ...routeInput, ctx: { ...transformedContext } };
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

  middleware<NewContext, Output>(
    fn: (routeInput: RouteInput<null, Context>) => Promise<Response<Output> | NewContext>,
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

  handle<Output>(fn: HandlerFunction<null, Context, Output>) {
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

  handle<Output>(fn: HandlerFunction<Schema, Context, Output>) {
    return {
      handler: buildHandler(fn, this._middlewares),
      input: this._inputSchema,
    };
  }
}

export const defaultRoute = new RouteBuilder();
