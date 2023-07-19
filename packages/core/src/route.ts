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

export type MiddlewareResult<Output, NewContext extends Record<string, unknown>> = MaybePromise<
  Response<Output> | NewContext | void
>;

export type MiddlewareFn<
  Result extends MiddlewareResult<Output, NewContext>,
  Context extends Record<string, unknown>,
  Output,
  NewContext extends Record<string, unknown>,
  Params extends Record<string, string> | unknown = unknown,
> = (routeInput: Omit<HandlerEvent<null, Context, Params>, "input">) => Result;

function buildMiddlewareStack<Schema, Context, Params extends Record<string, string> | unknown>(
  middlewares: Function[],
) {
  return async (routeInput: HandlerEvent<Schema, Context, Params>) => {
    let transformedContext = routeInput.ctx;

    for (const mw of middlewares) {
      const mwInput = { ...routeInput, ctx: { ...transformedContext } };
      const result = await mw(mwInput);

      if (result) {
        // TODO: could use instanceof Response
        if (result.__svartaResponse) {
          return result;
        } else {
          transformedContext = result;
        }
      }
    }

    return transformedContext;
  };
}

type RouteHandlerBuilder<
  Context extends Record<string, unknown> = {},
  Input = unknown,
  Output = unknown,
  Params extends Record<string, string> | unknown = unknown,
> = Omit<RouteBuilder<Context, Input, Output, Params>, "middleware">;

export class RouteBuilder<
  Context extends Record<string, unknown> = {},
  Input = null,
  Output = unknown,
  Params extends Record<string, string> | unknown = unknown,
> {
  protected _middlewares: Function[] = [];
  protected _params: readonly string[] = [];
  protected _inputSchema?: zod.Schema<Input>;
  protected _outputSchema?: zod.Schema<Output>;

  middleware<
    Result extends MiddlewareResult<Output, NewContext>,
    NewContext extends Record<string, unknown>,
    Output,
  >(
    fn: MiddlewareFn<Result, Context, Output, NewContext, Params>,
  ): RouteBuilder<
    Result extends void
      ? Context
      : Result extends Response<unknown>
      ? never
      : Extract<Result, NewContext>,
    Input,
    Output,
    Params
  > {
    const newRouteBuilder = new RouteBuilder<
      Result extends void
        ? Context
        : Result extends Response<unknown>
        ? never
        : Extract<Result, NewContext>,
      Input,
      Output,
      Params
    >();
    newRouteBuilder._middlewares.push(...this._middlewares, fn);
    return newRouteBuilder;
  }

  params<Params extends readonly string[]>(
    params: Params,
  ): RouteHandlerBuilder<Context, Input, Output, ParamArrayToDict<Params>> {
    const newRouteBuilder = new RouteBuilder<Context, Input, Output, ParamArrayToDict<Params>>();
    newRouteBuilder._middlewares.push(...this._middlewares);
    newRouteBuilder._params = params;
    return newRouteBuilder;
  }

  input<Schema>(schema: zod.Schema<Schema>): RouteHandlerBuilder<Context, Schema, Output, Params> {
    const newRouteBuilder = new RouteBuilder<Context, Schema, Output, Params>();
    newRouteBuilder._inputSchema = schema;
    newRouteBuilder._outputSchema = this._outputSchema;
    newRouteBuilder._middlewares.push(...this._middlewares);
    newRouteBuilder._params = this._params;
    return newRouteBuilder;
  }

  output<Schema>(schema: zod.Schema<Schema>): RouteHandlerBuilder<Context, Input, Schema, Params> {
    const newRouteBuilder = new RouteBuilder<Context, Input, Schema, Params>();
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
