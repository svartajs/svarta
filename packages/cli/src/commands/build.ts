import { Config } from "@svarta/core";

export async function build(config: Config): Promise<void> {
  if (config.adapter.type === "standalone") {
    const { adapter } = await import("@svarta/adapter-standalone");
    if (adapter.validateOptions(config.adapter)) {
      await adapter.build({
        projectFolder: process.cwd(),
        routeFolder: config.routeFolder,
        minify: config.minify ?? true,
        opts: config.adapter,
      });
    }
  } else {
    console.error("Unsupported adapter", config.adapter.type);
    process.exit(1);
  }
}
