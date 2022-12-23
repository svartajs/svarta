# svarta

[![TS ready](https://img.shields.io/static/v1?label=&message=TS+ready&color=000000&logo=typescript)]()
[![ESM ready](https://img.shields.io/static/v1?label=&message=ESM+ready&color=%23000000&logo=javascript)]()
[![CI](https://github.com/marvin-j97/svarta/actions/workflows/ci.yml/badge.svg)](https://github.com/marvin-j97/svarta/actions/workflows/ci.yml)
![npm](https://img.shields.io/npm/v/svarta)
![node-current](https://img.shields.io/node/v/svarta)
![GitHub last commit](https://img.shields.io/github/last-commit/marvin-j97/svarta)
![GitHub](https://img.shields.io/github/license/marvin-j97/svarta)

A TypeScript-native, ESM-native REST API framework.

By abstracting the underlying platform, it allows deployment to different platforms without changing your code. Routes are organized using file-based routing, commonly used in fullstack frameworks like Next.js or SvelteKit.

It aims to provide a more robust developer experience than established packages like [Express](https://expressjs.com/) or [Koa](https://koajs.com/).
Svarta can scaffold your application from the ground up, removing the overhead of installing and setting up development dependencies, toolchains and build scripts. *Say goodbye to setting up 15 packages to get your Express project started!*

## Bootstrap new project

```bash
npm create svarta-app
yarn create svarta-app
pnpm create svarta-app
```

For development, run:

```bash
npm run dev
yarn dev
pnpm dev
```

For building, run:

```bash
npm run build
yarn build
pnpm build
```
