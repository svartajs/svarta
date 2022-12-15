import { Config } from "@svarta/core";
import { startSvartaDevServer } from "@svarta/dev-server";

export async function startDevelopmentServer(config: Config): Promise<void> {
  await startSvartaDevServer(config.routeFolder);
}
