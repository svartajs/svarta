import { Status } from ".";
import Response from "./response";

export default class Redirect extends Response<void> {
  constructor(location: string, permanent: boolean) {
    super(permanent ? Status.MovedPermanently : Status.TemporaryRedirect);
    this._headers["Location"] = location;
  }
}
