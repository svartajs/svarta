import { ChildProcess, exec } from "node:child_process";
import { unlinkSync } from "node:fs";
import { resolve } from "node:path";

import fetch from "node-fetch";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildStandaloneServer } from "../src/build";

const serverFile = resolve("server.mjs");

describe("basics", () => {
  let proc: ChildProcess;

  beforeAll(async () => {
    await buildStandaloneServer({
      routeFolder: resolve("test/fixture"),
      defaultPort: 7777,
      outputFile: serverFile,
    });
    proc = exec(`node "${serverFile}"`);
    proc.on("message", (data) => console.log(data.toString()));

    await new Promise((resolve) => proc.on("spawn", resolve));
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  afterAll(() => {
    console.log("Killed server process");
    proc?.kill();
    unlinkSync(serverFile);
  });

  it("should correctly get info", async () => {
    const res = await fetch("http://localhost:7777/info");
    const body = await res.json();

    expect(res.status).to.equal(200);
    expect(res.headers.get("x-powered-by")).to.equal("svarta");
    expect(res.headers.get("content-type")).to.equal("application/json; charset=utf-8");

    expect(body).to.be.an("object");
    expect(body).to.have.property("method").that.equals("GET");
    expect(body).to.have.property("path").that.equals("/info");
    expect(body).to.have.property("url").that.equals("/info");
    expect(body).to.have.property("isDev").that.is.false;
    expect(body).to.have.property("query").that.deep.equals({});
  });

  it("should correctly get query", async () => {
    const res = await fetch("http://localhost:7777/info?test=2&name=peter");
    const body = await res.json();

    expect(res.status).to.equal(200);
    expect(res.headers.get("x-powered-by")).to.equal("svarta");
    expect(res.headers.get("content-type")).to.equal("application/json; charset=utf-8");

    expect(body).to.be.an("object");
    expect(body).to.have.property("path").that.equals("/info");
    expect(body).to.have.property("url").that.equals("/info?test=2&name=peter");
    expect(body).to.have.property("query").that.deep.equals({
      test: "2",
      name: "peter",
    });
  });

  it("should set status", async () => {
    const res = await fetch("http://localhost:7777/set_status");

    expect(res.status).to.equal(418);
    expect(res.headers.get("x-powered-by")).to.equal("svarta");
  });

  it("should set header", async () => {
    const res = await fetch("http://localhost:7777/set_header");

    expect(res.status).to.equal(200);
    expect(res.headers.get("x-powered-by")).to.equal("svarta");
    expect(res.headers.get("x-custom-header")).to.equal("123");
  });

  it("should get header", async () => {
    const headerName = "x-custom-header";
    const headerValue = "123";

    const res = await fetch("http://localhost:7777/get_headers", {
      headers: {
        [headerName]: headerValue,
      },
    });
    const body = await res.json();

    expect(res.status).to.equal(200);
    expect(res.headers.get("x-powered-by")).to.equal("svarta");
    expect(res.headers.get("content-type")).to.equal("application/json; charset=utf-8");
    expect(body).to.be.an("object").that.has.property("headers");
    // @ts-ignore
    const headers: [string, string][] = body.headers;

    expect(!!headers.find(([key, value]) => key === headerName && value === headerValue)).to.be
      .true;
  });

  // TODO: header.keys, header.get, header.values
  // TODO: cookies

  it("should get body", async () => {
    const data = {
      message: "hello",
    };

    const res = await fetch("http://localhost:7777/body", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "content-type": "application/json",
      },
    });
    const body = await res.json();

    expect(res.status).to.equal(200);
    expect(res.headers.get("x-powered-by")).to.equal("svarta");
    expect(res.headers.get("content-type")).to.equal("application/json; charset=utf-8");
    expect(body).to.be.an("object").that.has.property("input").that.deep.equal(data);
    expect(body).to.be.an("object").that.has.property("method").that.deep.equal("POST");
  });
});