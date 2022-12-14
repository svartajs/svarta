export type AdapterOptions<T> = {
  projectFolder: string;
  routeFolder: string;
  minify: boolean;
  opts: T;
};

export interface Adapter<T> {
  build(opts: AdapterOptions<T>): Promise<void>;
  validateOptions(opts: unknown): opts is T;
}
