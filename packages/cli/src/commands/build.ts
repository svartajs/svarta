import { Config } from "../config";

export async function build(config: Config): Promise<void> {
  if (config.adapter.type === "standalone") {
    const standaloneAdapter = await import("@svarta/adapter-standalone");
    standaloneAdapter.buildStandaloneServer(
      config.routeFolder,
      config.adapter.outputFile,
      config.minify,
    );
  } else {
    console.error("Unsupported adapter", config.adapter.type);
    process.exit(1);
  }
}
