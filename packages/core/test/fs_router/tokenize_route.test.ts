import { describe, expect, it } from "vitest";

import { tokenizeRoute } from "../../src/fs_router";

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

    it("should work for /hello/[...rest]/", () => {
      expect(tokenizeRoute("/hello/[...rest]/")).to.deep.equal([
        { type: "sep" },
        { type: "static", value: "hello" },
        { type: "sep" },
        { type: "catchAll", name: "rest" },
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

    it("should remove trailing slash for /[first]/[last]/", () => {
      expect(tokenizeRoute("/[first]/[last]")).to.deep.equal([
        { type: "sep" },
        { type: "param", name: "first" },
        { type: "sep" },
        { type: "param", name: "last" },
      ]);
    });

    it("should keep trailing slash for /[first]/[last]/", () => {
      expect(tokenizeRoute("/[first]/[last]/", false)).to.deep.equal([
        { type: "sep" },
        { type: "param", name: "first" },
        { type: "sep" },
        { type: "param", name: "last" },
        { type: "sep" },
      ]);
    });
  });
});
