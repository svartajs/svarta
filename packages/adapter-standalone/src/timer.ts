export class Timer {
  private _start = +new Date();
  private _stop = +new Date();

  stop() {
    this._stop = +new Date();
  }

  reset() {
    this._start = +new Date();
  }

  asMilli() {
    return this._stop - this._start;
  }

  asSeconds(decimals = 2) {
    return (this.asMilli() / 1000).toFixed(decimals);
  }
}
