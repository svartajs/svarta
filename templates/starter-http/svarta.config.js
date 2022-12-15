/**
 * @type {import("@svarta/cli").Config}
 */
const config = {
  routeFolder: "routes",
  minify: true,
  adapter: {
    type: "standalone",
    outputFile: ".output/server.mjs",
  }
};

export default config;