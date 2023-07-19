import { ChildProcess, spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

import { parse, serialize } from "@tinyhttp/cookie";
import fetch from "node-fetch";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import YAML from "yaml";
import { DEFAULTS as CORS_DEFAULTS } from "./fixture/cors";

import { buildStandaloneServer } from "../src/build";

const PORT = 7777 + Math.floor(Math.random() * 1000);
const URL = `http://127.0.0.1:${PORT}`;

const OUTPUT_FOLDER = resolve(".output");

function buildUrl(path: string): string {
  return `${URL}${path}`;
}

describe("basics", () => {
  let proc: ChildProcess;

  beforeAll(async () => {
    const routeFolder = resolve("test/fixture/routes");
    console.error(`Building server using folder ${routeFolder}`);

    const { entryFile } = await buildStandaloneServer({
      routeFolder,
      defaultPort: PORT,
      outputFolder: OUTPUT_FOLDER,
      logger: true,
      runtime: "node",
    });

    console.error(`Running server at ${entryFile}`);
    proc = spawn("node", [entryFile], {
      stdio: "pipe",
    });
    proc.stderr?.on("data", (data) => {
      console.error(`[test-server] ${data.toString()}`);
    });

    await new Promise((resolve) => proc.on("spawn", resolve));
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  afterAll(() => {
    console.log("Killing server process");
    proc?.kill();
    rmSync(OUTPUT_FOLDER, { recursive: true });
  });

  it("should handle server error", async () => {
    const res = await fetch(buildUrl("/error"));
    const body = await res.text();

    expect(res.status).to.equal(500);
    expect(body).to.equal("Internal Server Error");
  });

  it("should handle not found", async () => {
    const res = await fetch(buildUrl("/some/unknown/route"));
    const body = await res.text();

    expect(res.status).to.equal(404);
    expect(body).to.equal("My custom Not Found");
  });

  it("should correctly get info", async () => {
    const res = await fetch(buildUrl("/info"));
    const body = await res.json();

    expect(res.status).to.equal(200);
    expect(res.headers.get("content-type")).to.equal("application/json; charset=utf-8");

    expect(body).to.be.an("object");
    expect(body).to.have.property("method").that.equals("GET");
    expect(body).to.have.property("path").that.equals("/info");
    expect(body).to.have.property("url").that.equals("/info");
    expect(body).to.have.property("isDev").that.is.false;
    expect(body).to.have.property("query").that.deep.equals({});
  });

  it("should correctly head info", async () => {
    const res = await fetch(buildUrl("/info"), {
      method: "HEAD",
    });
    const body = await res.text();
    expect(body).to.have.lengthOf(0);

    expect(res.status).to.equal(200);
    expect(res.headers.get("content-type")).to.equal("application/json; charset=utf-8");
  });

  it("should correctly use DELETE route", async () => {
    const res = await fetch(buildUrl("/hello"), {
      method: "DELETE",
    });
    const body = await res.json();

    expect(res.status).to.equal(200);
    expect(res.headers.get("content-type")).to.equal("application/json; charset=utf-8");

    expect(body).to.be.an("object");
    expect(body).to.have.property("method").that.equals("DELETE");
  });

  it("should correctly use PUT route", async () => {
    const res = await fetch(buildUrl("/hello"), {
      method: "PUT",
    });
    const body = await res.json();

    expect(res.status).to.equal(200);
    expect(res.headers.get("content-type")).to.equal("application/json; charset=utf-8");

    expect(body).to.be.an("object");
    expect(body).to.have.property("method").that.equals("PUT");
  });

  it("should correctly use PATCH route", async () => {
    const res = await fetch(buildUrl("/hello"), {
      method: "PATCH",
    });
    const body = await res.json();

    expect(res.status).to.equal(200);
    expect(res.headers.get("content-type")).to.equal("application/json; charset=utf-8");

    expect(body).to.be.an("object");
    expect(body).to.have.property("method").that.equals("PATCH");
  });

  it("should correctly use OPTIONS route", async () => {
    const res = await fetch(buildUrl("/hello"), {
      method: "OPTIONS",
    });
    const body = await res.json();

    expect(res.status).to.equal(200);
    expect(res.headers.get("content-type")).to.equal("application/json; charset=utf-8");

    expect(body).to.be.an("object");
    expect(body).to.have.property("method").that.equals("OPTIONS");
  });

  describe("middlewares", () => {
    it("should correctly pass through context from middleware", async () => {
      const res = await fetch(buildUrl("/middleware"));
      const body = await res.json();

      expect(res.status).to.equal(200);

      expect(res.headers.get("content-type")).to.equal("application/json; charset=utf-8");

      expect(body).to.be.an("object");
      expect(body).to.have.property("user").that.equals("peter");
    });

    it("should correctly respond from middleware", async () => {
      const res = await fetch(buildUrl("/middleware_stop"));
      const body = await res.text();
      expect(body).to.have.lengthOf(0);

      expect(res.status).to.equal(418);
    });

    it("should correctly run middleware before input validation", async () => {
      const res = await fetch(buildUrl("/middleware"), {
        method: "POST",
        body: "abw4abwbaw54",
      });
      const body = await res.text();
      expect(body).to.have.lengthOf(0);

      expect(res.status).to.equal(418);
    });
  });

  describe("query", () => {
    it("should correctly get query", async () => {
      const res = await fetch(buildUrl("/info?test=2&name=peter"));
      const body = await res.json();

      expect(res.status).to.equal(200);

      expect(res.headers.get("content-type")).to.equal("application/json; charset=utf-8");

      expect(body).to.be.an("object");
      expect(body).to.have.property("path").that.equals("/info");
      expect(body).to.have.property("url").that.equals("/info?test=2&name=peter");
      expect(body).to.have.property("query").that.deep.equals({
        test: "2",
        name: "peter",
      });
    });
  });

  describe("status", () => {
    it("should set status", async () => {
      const res = await fetch(buildUrl("/set_status"));

      expect(res.status).to.equal(418);
    });
  });

  describe("headers", () => {
    it("render some html", async () => {
      const res = await fetch(buildUrl("/html"));
      const body = await res.text();

      expect(res.status).to.equal(200);

      expect(res.headers.get("content-type")).to.equal("text/html");
      expect(res.headers.get("Content-Type")).to.equal("text/html");
      expect(body)
        .to.be.a("string")
        .that.satisfies((str: string) => str.startsWith("<html>"));
    });

    it("should set header", async () => {
      const res = await fetch(buildUrl("/set_header"));

      expect(res.status).to.equal(200);

      expect(res.headers.get("x-custom-header")).to.equal("123");
    });

    it("should get header", async () => {
      const headerName = "x-custom-header";
      const headerValue = "123";

      const res = await fetch(buildUrl("/get_headers"), {
        headers: {
          [headerName]: headerValue,
        },
      });
      const body = await res.json();

      expect(res.status).to.equal(200);

      expect(res.headers.get("content-type")).to.equal("application/json; charset=utf-8");
      expect(body).to.be.an("object").that.has.property("headers");
      // @ts-ignore
      const headers: [string, string][] = body.headers;

      expect(!!headers.find(([key, value]) => key === headerName && value === headerValue)).to.be
        .true;
    });

    it("should set CORS", async () => {
      const res = await fetch(buildUrl("/cors"));
      const body = await res.json();

      expect(res.status).to.equal(200);

      expect(body).to.be.an("object").that.has.property("message").that.equals("Hello");
      expect(res.headers.get("Access-Control-Allow-Origin")).to.equal(CORS_DEFAULTS.origin);
      expect(res.headers.get("Access-Control-Allow-Methods")).to.equal(CORS_DEFAULTS.methods);
      expect(res.headers.get("Access-Control-Allow-Allow-Headers")).to.equal(
        CORS_DEFAULTS.allowHeaders,
      );
      expect(res.headers.get("Access-Control-Allow-Expose-Headers")).to.equal(
        CORS_DEFAULTS.exposeHeaders,
      );
    });
  });

  describe("cookies", () => {
    it("should get & set cookies", async () => {
      const cookieName = "x-custom-header";
      const cookieValue = "123";

      const res = await fetch(buildUrl("/cookies"), {
        headers: {
          Cookie: serialize(cookieName, cookieValue),
        },
      });
      const body = await res.json();

      expect(res.status).to.equal(200);

      expect(body).to.be.an("object").that.has.property("cookies");
      // @ts-ignore
      const cookies: [string, string][] = body.cookies;

      expect(!!cookies.find(([key, value]) => key === cookieName && value === cookieValue)).to.be
        .true;

      expect(parse(res.headers.get("set-cookie")!)).to.deep.equal({
        "cookie-1": "abc",
        "cookie-2": "xyz",
      });
    });
  });

  describe("body", () => {
    it("should handle invalid json", async () => {
      const res = await fetch(buildUrl("/body"), {
        method: "POST",
        body: "{asda5wa}",
        headers: {
          "content-type": "application/json",
        },
      });
      const body = await res.text();

      expect(res.status).to.equal(400);

      expect(body).to.equal("My custom Bad Request");
    });

    it("should handle invalid output", async () => {
      const res = await fetch(buildUrl("/output"));
      const body = await res.text();

      expect(res.status).to.equal(500);

      expect(body).to.equal("Internal Server Error");
    });

    it("should validate body", async () => {
      const res = await fetch(buildUrl("/body"), {
        method: "POST",
        body: JSON.stringify({
          msg: "hello",
        }),
        headers: {
          "content-type": "application/json",
        },
      });
      const body = await res.text();

      expect(res.status).to.equal(422);

      expect(body).to.equal("My custom Unprocessable Entity");
    });

    it("should get body", async () => {
      const data = {
        message: "hello",
      };

      const res = await fetch(buildUrl("/body"), {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "content-type": "application/json",
        },
      });
      const body = await res.json();

      expect(res.status).to.equal(200);

      expect(res.headers.get("content-type")).to.equal("application/json; charset=utf-8");
      expect(body).to.be.an("object").that.has.property("input").that.deep.equal(data);
      expect(body).to.be.an("object").that.has.property("method").that.deep.equal("POST");
    });

    it("should get raw body", async () => {
      const res = await fetch(buildUrl("/raw_body"));
      const body = await res.text();

      expect(res.status).to.equal(200);

      expect(body).to.be.a("string").that.equals("hello world");
    });

    it("should get yaml body", async () => {
      const res = await fetch(buildUrl("/yaml"));
      const textBody = await res.text();
      const body = YAML.parse(textBody);

      expect(res.status).to.equal(200);

      expect(res.headers.get("content-type")).to.equal("application/yml; charset=utf-8");
      expect(body).to.be.an("object").that.has.property("message").that.equals("hello world");
    });
  });

  describe("params", () => {
    it("should correctly match param", async () => {
      const res = await fetch(buildUrl("/some-other-route"));
      const body = await res.json();

      expect(res.status).to.equal(200);

      expect(body).to.be.an("object");
      expect(body).to.have.property("params").that.has.property("id").equals("some-other-route");
      expect(body).to.have.property("path").that.equals("/some-other-route");
    });

    it("should correctly match param 2", async () => {
      const res = await fetch(buildUrl("/yet-another-route"));
      const body = await res.json();

      expect(res.status).to.equal(200);

      expect(body).to.be.an("object");
      expect(body).that.has.property("params").that.has.property("id").equals("yet-another-route");
      expect(body).to.have.property("path").that.equals("/yet-another-route");
    });

    it("should correctly match multiple params", async () => {
      const res = await fetch(buildUrl("/hello/peter"));
      const body = await res.json();

      expect(res.status).to.equal(200);

      expect(body).to.be.an("object");
      expect(body).that.has.property("params").that.has.property("greeting").equals("hello");
      expect(body).that.has.property("params").that.has.property("name").equals("peter");
      expect(body).to.have.property("path").that.equals("/hello/peter");
    });

    it("should correctly match multiple params 2", async () => {
      const res = await fetch(buildUrl("/hi/miranda"));
      const body = await res.json();

      expect(res.status).to.equal(200);

      expect(body).to.be.an("object");
      expect(body).that.has.property("params").that.has.property("greeting").equals("hi");
      expect(body).that.has.property("params").that.has.property("name").equals("miranda");
      expect(body).to.have.property("path").that.equals("/hi/miranda");
    });
  });
});
