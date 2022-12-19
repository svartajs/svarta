import standaloneAdapter from "@svarta/adapter-standalone";

/**
 * @type {import("@svarta/cli").Config}
 */
const config = {
  routeFolder: "routes",
  minify: true,
  adapter: standaloneAdapter({
    provider: "tinyhttp",
    outputFile: ".output/server.mjs",
    logger: {
      enabled: true,
    },
  })
};

export default config;