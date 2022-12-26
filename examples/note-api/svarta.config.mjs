import standaloneAdapter from "@svarta/adapter-standalone";

/**
 * @type {import("@svarta/cli").Config}
 */
const config = {
  packageManager: "npm",
  routeFolder: "routes",
  minify: true,
  adapter: standaloneAdapter({
    defaultPort: 7777,
    provider: "tinyhttp",
    outputFile: ".output/server.mjs",
    logger: {
      enabled: true,
    },
  })
};

export default config;