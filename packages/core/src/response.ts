import type { default as Status } from "./status";

export default class Response<T> {
  __svartaResponse = true;
  _status: number;
  _body?: T;

  constructor(status: typeof Status[keyof typeof Status] | number, body?: T) {
    this._status = status;
    this._body = body;
  }
}
