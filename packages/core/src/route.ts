import * as zod from "zod";

import HandlerEvent from "./handler_event";
import Response from "./response";

type ParamArrayToDict<T extends readonly string[]> = {
  [key in T[number]]: string;
};

type MaybePromise<T> = T | Promise<T>;

export type HandlerFn<Input, Output, Context, Params extends Record<string, string> | unknown> = (
  routeInput: HandlerEvent<Input, Context, Params>,
) => MaybePromise<Response<Output>>;

export function defineBadRequestErrorHandler(fn: BadRequestErrorHandlerFn) {
  return fn;
}

export function defineNotFoundErrorHandler(fn: NotFoundErrorHandlerFn) {
  return fn;
}

export function defineInvalidInputErrorHandler(fn: InvalidInputErrorHandlerFn) {
  return fn;
}

/* export function defineInternalServerErrorHandler(fn: InternalServerErrorHandlerFn) {
  return fn;
} */

/* export function defineUnknownErrorHandler(fn: UnknownErrorHandlerFn) {
  return fn;
} */

export type BadRequestErrorHandlerFn = (
  error: unknown,
  routeInput: Omit<HandlerEvent<never, unknown, unknown>, "input">,
) => MaybePromise<Response<any>>;

export type NotFoundErrorHandlerFn = (
  routeInput: Omit<HandlerEvent<never, unknown, unknown>, "input">,
) => MaybePromise<Response<any>>;

export type InvalidInputErrorHandlerFn = (
  error: zod.ZodError<unknown>,
  routeInput: Omit<HandlerEvent<unknown, unknown, unknown>, "input">,
) => MaybePromise<Response<any>>;

/* export type InternalServerErrorHandlerFn = (
  error: unknown,
  routeInput: Omit<HandlerEvent<never, unknown, unknown, unknown>, "input">,
) => MaybePromise<Response<any>>; */

export type MiddlewareFn<
  Output,
  NewContext,
  Context = {},
  Params extends Record<string, string> | unknown = unknown,
> = (
  routeInput: Omit<HandlerEvent<null, Context, Params>, "input">,
) => MaybePromise<Response<Output> | NewContext>;

function buildMiddlewareStack<
  Schema,
  Output,
  Context,
  Params extends Record<string, string> | unknown,
>(middlewares: Function[]) {
  return async (routeInput: HandlerEvent<Schema, Context, Params>) => {
    let transformedContext = routeInput.ctx;
    for (const mw of middlewares) {
      const mwInput = { ...routeInput, ctx: { ...transformedContext } };
      const result = await mw(mwInput);

      if (result?.__svartaResponse) {
        return result;
      } else {
        transformedContext = result;
      }
    }
    return transformedContext;
  };
}

type RouteHandlerBuilder<
  Input = unknown,
  Output = unknown,
  Context = {},
  Params extends Record<string, string> | unknown = unknown,
> = Omit<RouteBuilder<Input, Output, Context, Params>, "middleware">;

export class RouteBuilder<
  Input = null,
  Output = unknown,
  Context = {},
  Params extends Record<string, string> | unknown = unknown,
> {
  protected _middlewares: Function[] = [];
  protected _params: readonly string[] = [];
  protected _inputSchema?: zod.Schema<Input>;
  protected _outputSchema?: zod.Schema<Output>;

  middleware<NewContext, Output>(
    fn: MiddlewareFn<Output, NewContext, Context, Params>,
  ): RouteBuilder<Input, Output, NewContext, Params> {
    const newRouteBuilder = new RouteBuilder<Input, Output, NewContext, Params>();
    newRouteBuilder._middlewares.push(...this._middlewares, fn);
    return newRouteBuilder;
  }

  params<Params extends readonly string[]>(
    params: Params,
  ): RouteHandlerBuilder<Input, Output, Context, ParamArrayToDict<Params>> {
    const newRouteBuilder = new RouteBuilder<Input, Output, Context, ParamArrayToDict<Params>>();
    newRouteBuilder._middlewares.push(...this._middlewares);
    newRouteBuilder._params = params;
    return newRouteBuilder;
  }

  input<Schema>(schema: zod.Schema<Schema>): RouteHandlerBuilder<Schema, Output, Context, Params> {
    const newRouteBuilder = new RouteBuilder<Schema, Output, Context, Params>();
    newRouteBuilder._inputSchema = schema;
    newRouteBuilder._outputSchema = this._outputSchema;
    newRouteBuilder._middlewares.push(...this._middlewares);
    newRouteBuilder._params = this._params;
    return newRouteBuilder;
  }

  output<Schema>(schema: zod.Schema<Schema>): RouteHandlerBuilder<Input, Schema, Context, Params> {
    const newRouteBuilder = new RouteBuilder<Input, Schema, Context, Params>();
    newRouteBuilder._inputSchema = this._inputSchema;
    newRouteBuilder._outputSchema = schema;
    newRouteBuilder._middlewares.push(...this._middlewares);
    newRouteBuilder._params = this._params;
    return newRouteBuilder;
  }

  handle(fn: HandlerFn<Input, Output, Context, Params>) {
    return {
      handler: fn,
      runMiddlewares: buildMiddlewareStack(this._middlewares),
      input: this._inputSchema,
      output: this._outputSchema,
    };
  }
}

export const defaultRoute = new RouteBuilder();
