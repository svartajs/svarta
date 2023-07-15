import Status from "./status";
import Response from "./response";

export default class Redirect extends Response<void> {
  constructor(location: string, opts?: { permanent: boolean }) {
    super(opts?.permanent ? Status.MovedPermanently : Status.TemporaryRedirect);
    this._headers["Location"] = location;
  }
}
