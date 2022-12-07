import type { default as Status } from "./status";

export default class Response {
  __svartaResponse = true;
  _status: number;
  _body?: string;

  constructor(status: typeof Status[keyof typeof Status] | number, body?: string) {
    this._status = status;
    this._body = body;
  }
}
