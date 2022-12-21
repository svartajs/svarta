import { describe, expect, it } from "vitest";

import { formatRoutePath, tokenizeRoute } from "../../src/fs_router";

describe("fs_router", () => {
  describe("expectedRoutes", () => {
    const expectedRoutes: [string, string][] = [
      ["/", "/"],
      ["/user.get.ts", "/user"],
      ["/[user].get.ts", "/:user"],
      ["/user/[id].get.ts", "/user/:id"],
    ];

    for (const [input, expected] of expectedRoutes) {
      it(`should correctly format ${input}`, () => {
        const result = formatRoutePath(tokenizeRoute(input));
        expect(result).to.equal(expected);
      });
    }
  });
});
