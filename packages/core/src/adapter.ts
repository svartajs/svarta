export type AdapterOptions<T> = {
  projectFolder: string;
  routeFolder: string;
  minify: boolean;
  opts: T;
};

export interface Adapter<Options, DeployOptions> {
  validateOptions(opts: unknown): opts is Options;
  build(opts: AdapterOptions<Options>): Promise<void>;
  deploy(opts: DeployOptions): Promise<void>;
}
