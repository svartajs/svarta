import Response from "./response";

export default class Redirect extends Response<void> {
  constructor(location: string, permanent: boolean) {
    super(permanent ? 308 : 304);
    this._headers["Location"] = location;
  }
}
