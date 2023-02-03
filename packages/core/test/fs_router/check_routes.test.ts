import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { loadRoutes } from "../../src/check_routes";
import { collectRouteFiles } from "../../src/collect_routes";

describe("fs_router", () => {
  describe("checkRoutes", async () => {
    const FIXTURE_PATH = resolve(__dirname, ".fixture/check_routes");

    it("should correctly check routes", async () => {
      const { errors } = await loadRoutes(await collectRouteFiles(FIXTURE_PATH));

      expect(errors).to.have.lengthOf(2);
      expect(errors[0].code).to.equal("duplicate_route_name");
      expect(errors[1].code).to.equal("duplicate_route_path");
    });
  });
});
