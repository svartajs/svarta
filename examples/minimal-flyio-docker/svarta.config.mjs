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
    outputFolder: ".output",
    logger: {
      enabled: true,
    },
  }),
};

export default config;
