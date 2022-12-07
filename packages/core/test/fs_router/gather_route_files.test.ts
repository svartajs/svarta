import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { collectRouteFiles } from "../../src/fs_router";

describe("fs_router", () => {
  describe("collectRouteFiles", () => {
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
      const foundRoutes = await collectRouteFiles(FIXTURE_PATH);
      expect(foundRoutes).to.deep.equal(expectedRoutes);
    });
  });
});
