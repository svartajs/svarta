import { describe, expect, it } from "vitest";

import { loadTemplates } from "../src/templates";

describe("root", () => {
  it("should load templates", async () => {
    expect(await loadTemplates()).to.have.length(1);
  });
});
