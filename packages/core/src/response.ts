export class Response<T> {
  __svartaResponse = true;
  _status: number;
  _body?: T;
  _headers: Record<string, string> = {};

  constructor(status: number, body?: T) {
    this._status = status;
    this._body = body;
  }
}
