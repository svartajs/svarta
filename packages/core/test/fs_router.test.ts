import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { gatherRouteFiles, tokenizeRoute } from "../src/fs_router";

describe("fs_router", () => {
  describe("tokenizeRoute", () => {
    it("should work for /", () => {
      expect(tokenizeRoute("/")).to.deep.equal([{ type: "sep" }]);
    });

    it("should work for /hello", () => {
      expect(tokenizeRoute("/hello")).to.deep.equal([
        { type: "sep" },
        { type: "static", value: "hello" },
      ]);
    });

    it("should work for /[name]", () => {
      expect(tokenizeRoute("/[name]")).to.deep.equal([
        { type: "sep" },
        { type: "param", name: "name" },
      ]);
    });

    it("should work for /hello/[name]", () => {
      expect(tokenizeRoute("/hello/[name]")).to.deep.equal([
        { type: "sep" },
        { type: "static", value: "hello" },
        { type: "sep" },
        { type: "param", name: "name" },
      ]);
    });

    it("should work for /[first]/[last]", () => {
      expect(tokenizeRoute("/[first]/[last]")).to.deep.equal([
        { type: "sep" },
        { type: "param", name: "first" },
        { type: "sep" },
        { type: "param", name: "last" },
      ]);
    });
  });

  describe("gatherRouteFiles", () => {
    const FIXTURE_PATH = resolve(__dirname, ".fixture/routes");

    const expectedRoutes = [
      {
        path: resolve(FIXTURE_PATH, "get.ts"),
        routeSegments: [{ type: "sep" }],
        method: "GET",
      },
      {
        path: resolve(FIXTURE_PATH, "post.ts"),
        routeSegments: [{ type: "sep" }],
        method: "POST",
      },
      {
        path: resolve(FIXTURE_PATH, "[id]/get.ts"),
        routeSegments: [{ type: "sep" }, { type: "param", name: "id" }],
        method: "GET",
      },
    ].sort((a, b) => a.path.localeCompare(b.path));

    it("should get correct files from folder", async () => {
      const foundRoutes = await gatherRouteFiles(FIXTURE_PATH);
      expect(foundRoutes).to.deep.equal(expectedRoutes);
    });
  });
});
