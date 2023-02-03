import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { collectRouteFiles } from "../../src/collect_routes";

describe("fs_router", () => {
  describe("collectRouteFiles", () => {
    const FIXTURE_PATH = resolve(__dirname, ".fixture/collect_routes");

    const expectedRoutes = [
      /*   {
        path: resolve(FIXTURE_PATH, "_500.ts"),
        routeSegments: [{ type: "sep" }],
        method: "GET",
      }, */
      {
        path: resolve(FIXTURE_PATH, "index.get.ts"),
        routeSegments: [{ type: "sep" }],
        method: "GET",
      },
      {
        path: resolve(FIXTURE_PATH, "index.post.ts"),
        routeSegments: [{ type: "sep" }],
        method: "POST",
      },
      {
        path: resolve(FIXTURE_PATH, "render.get.tsx"),
        routeSegments: [{ type: "sep" }, { type: "static", value: "render" }],
        method: "GET",
      },
      {
        path: resolve(FIXTURE_PATH, "user.post.ts"),
        routeSegments: [{ type: "sep" }, { type: "static", value: "user" }],
        method: "POST",
      },
      {
        path: resolve(FIXTURE_PATH, "[id]/index.get.ts"),
        routeSegments: [{ type: "sep" }, { type: "param", name: "id" }],
        method: "GET",
      },
      {
        path: resolve(FIXTURE_PATH, "[...rest]/index.get.ts"),
        routeSegments: [{ type: "sep" }, { type: "catchAll", name: "rest" }],
        method: "GET",
      },
    ];

    it("should get correct files from folder", async () => {
      const foundRoutes = await collectRouteFiles(FIXTURE_PATH);
      expect(foundRoutes).to.deep.equal(expectedRoutes);
    });
  });
});
