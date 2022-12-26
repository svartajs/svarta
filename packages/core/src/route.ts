import * as zod from "zod";

import HandlerEvent from "./handler_event";
import Response from "./response";

type ParamArrayToDict<T extends readonly string[]> = {
  [key in T[number]]: string;
};

export type HandlerFunction<
  Schema,
  Context,
  Params extends Record<string, string> | unknown,
  Output,
> = (routeInput: HandlerEvent<Schema, Context, Params>) => Promise<Response<Output>>;

export type MiddlewareFn<
  Output,
  NewContext,
  Context = {},
  Params extends Record<string, string> | unknown = unknown,
> = (routeInput: HandlerEvent<null, Context, Params>) => Promise<Response<Output> | NewContext>;

function buildHandler<Schema, Context, Params extends Record<string, string> | unknown, Output>(
  fn: HandlerFunction<Schema, Context, Params, Output>,
  middlewares: Function[],
) {
  return async (routeInput: HandlerEvent<Schema, Context, Params>) => {
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

export class RouteBuilder<Context = {}, Params extends Record<string, string> | unknown = unknown> {
  protected _middlewares: Function[] = [];
  protected _params: readonly string[] = [];

  middleware<NewContext, Output>(
    fn: MiddlewareFn<Output, NewContext, Context, Params>,
  ): RouteBuilder<NewContext, Params> {
    const newRouteBuilder = new RouteBuilder<NewContext, Params>();
    newRouteBuilder._middlewares.push(...this._middlewares, fn);
    return newRouteBuilder;
  }

  params<Params extends readonly string[]>(params: Params) {
    const newRouteBuilder = new RouteBuilder<Context, ParamArrayToDict<Params>>();
    newRouteBuilder._middlewares.push(...this._middlewares);
    newRouteBuilder._params = params;
    return newRouteBuilder;
  }

  input<Schema>(schema: zod.Schema<Schema>): ValidatedRouteBuilder<Schema, Context> {
    const newRouteBuilder = new ValidatedRouteBuilder<Schema, Context>(schema);
    newRouteBuilder._middlewares.push(...this._middlewares);
    return newRouteBuilder;
  }

  handle<Output>(fn: HandlerFunction<null, Context, Params, Output>) {
    return {
      handler: buildHandler(fn, this._middlewares),
      input: null,
    };
  }
}

export class ValidatedRouteBuilder<
  Schema,
  Context = {},
  Params extends Record<string, string> = {},
> {
  _middlewares: Function[] = [];
  protected _inputSchema: zod.Schema<Schema>;

  constructor(schema: zod.Schema<Schema>) {
    this._inputSchema = schema;
  }

  handle<Output>(fn: HandlerFunction<Schema, Context, Params, Output>) {
    return {
      handler: buildHandler(fn, this._middlewares),
      input: this._inputSchema,
    };
  }
}

export const defaultRoute = new RouteBuilder();
