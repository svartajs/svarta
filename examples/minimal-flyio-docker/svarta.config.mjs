import standaloneAdapter from "@svarta/adapter-standalone";

/**
 * @type {import("@svarta/cli").Config}
 */
const config = {
  packageManager: "pnpm",
  routeFolder: "routes",
  minify: true,
  adapter: standaloneAdapter({
    defaultPort: 8080,
    runtime: "node",
    outputFile: ".output/server.mjs",
    logger: {
      enabled: true,
    },
  }),
};

export default config;
